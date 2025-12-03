import joblib
import os
import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PricePredictorService:
    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            # Default to ../../model relative to this file
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.model_dir = os.path.join(base_dir, "../../model")
        else:
            self.model_dir = model_dir

        self.model = None
        self.model_features = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        """Loads the XGBoost model and feature names."""
        try:
            model_path = os.path.join(self.model_dir, "flight_price_xgb_model.joblib")
            features_path = os.path.join(self.model_dir, "model_features.joblib")

            if not os.path.exists(model_path):
                logger.warning(f"Model file not found at {model_path}. Prediction disabled.")
                return

            self.model = joblib.load(model_path)
            
            # Try to load features from file, fallback to model attribute
            if os.path.exists(features_path):
                self.model_features = joblib.load(features_path)
            elif hasattr(self.model, "feature_names_in_"):
                self.model_features = self.model.feature_names_in_.tolist()
            elif hasattr(self.model, "get_booster"):
                self.model_features = self.model.get_booster().feature_names
            else:
                logger.warning("Could not determine model features. Prediction might fail.")
                self.model_features = []

            self.is_loaded = True
            logger.info("Price prediction model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load price prediction model: {e}")
            self.is_loaded = False

    def predict_price(self, flight_data: Dict[str, Any]) -> Optional[float]:
        """
        Predicts the price for a single flight.
        Returns None if model is not loaded or prediction fails.
        """
        if not self.is_loaded:
            return None

        try:
            # Prepare input dataframe
            input_data = {
                "Date": [flight_data.get("date")],
                "Distance_km": [flight_data.get("distance_km")],
                "Weekday": [flight_data.get("weekday")],
                "Month": [flight_data.get("month")],
                "Days_until_departure": [flight_data.get("days_until_departure", 30)],
                "Origin_Lat": [flight_data.get("origin_lat", 0.0)],
                "Origin_Lon": [flight_data.get("origin_lon", 0.0)],
                "Destination_Lat": [flight_data.get("dest_lat", 0.0)],
                "Destination_Lon": [flight_data.get("dest_lon", 0.0)],
            }

            df = pd.DataFrame(input_data)

            # One-hot encode Weekday
            df_encoded = pd.get_dummies(df, columns=["Weekday"])

            # Align columns with model features
            # This handles missing columns (fills with 0) and extra columns (drops them)
            # This is the "reindex" magic that pandas does well
            if self.model_features:
                df_final = df_encoded.reindex(columns=self.model_features, fill_value=0)
            else:
                df_final = df_encoded

            # Predict
            predicted_price = self.model.predict(df_final)[0]
            return float(predicted_price)

        except Exception as e:
            logger.error(f"Error predicting price: {e}")
            return None

    def predict_trend(
        self, flight_data: Dict[str, Any], current_price: float, threshold: float = 10.0
    ) -> str:
        """
        Predicts the price trend for the next 7 days.
        Returns 'rising', 'falling', or 'stable'.
        """
        if not self.is_loaded:
            return "stable"

        try:
            from datetime import datetime, timedelta

            base_date_str = flight_data.get("date")
            return_date_str = flight_data.get("return_date")
            base_date = datetime.strptime(base_date_str, "%Y-%m-%d")
            
            return_date = None
            if return_date_str:
                return_date = datetime.strptime(return_date_str, "%Y-%m-%d")

            predictions = []
            
            # Predict for next 7 days
            for i in range(1, 8):
                # Shift outbound date
                next_date = base_date + timedelta(days=i)
                next_date_str = next_date.strftime("%Y-%m-%d")
                
                # Prepare outbound data
                outbound_data = flight_data.copy()
                outbound_data["date"] = next_date_str
                outbound_data["weekday"] = next_date.strftime("%A")
                outbound_data["year"] = next_date.year
                outbound_data["month"] = next_date.month
                outbound_data["day"] = next_date.day
                
                current_days_until = outbound_data.get("days_until_departure", 0)
                outbound_data["days_until_departure"] = current_days_until + i

                # Predict outbound
                pred_outbound = self.predict_price(outbound_data)
                
                if pred_outbound is None:
                    continue

                total_pred = pred_outbound

                # Handle return leg if exists
                if return_date:
                    next_return_date = return_date + timedelta(days=i)
                    next_return_date_str = next_return_date.strftime("%Y-%m-%d")
                    
                    return_data = flight_data.copy()
                    # Swap origin/dest
                    return_data["origin_lat"] = flight_data.get("dest_lat")
                    return_data["origin_lon"] = flight_data.get("dest_lon")
                    return_data["dest_lat"] = flight_data.get("origin_lat")
                    return_data["dest_lon"] = flight_data.get("origin_lon")
                    
                    return_data["date"] = next_return_date_str
                    return_data["weekday"] = next_return_date.strftime("%A")
                    return_data["year"] = next_return_date.year
                    return_data["month"] = next_return_date.month
                    return_data["day"] = next_return_date.day
                    
                    # Calculate days until for return leg
                    # Assuming booking is done 'now', so days_until increases by i
                    # But the base days_until for return is different.
                    # Let's approximate: original days_until + duration + i
                    # Or simpler: if we have the dates, we can't easily recalculate days_until without 'now'.
                    # But we know outbound_days_until increases by i.
                    # Return leg is just another flight.
                    # Let's assume the gap between outbound and return stays the same.
                    # So return_days_until = outbound_days_until + (return_date - base_date).days
                    
                    trip_duration_days = (return_date - base_date).days
                    return_data["days_until_departure"] = outbound_data["days_until_departure"] + trip_duration_days

                    pred_return = self.predict_price(return_data)
                    
                    if pred_return is not None:
                        total_pred += pred_return
                    else:
                        # If return prediction fails, maybe skip this day?
                        continue

                predictions.append(total_pred)

            if not predictions:
                return "stable"

            avg_predicted_price = sum(predictions) / len(predictions)
            
            if (return_date):
                diff = avg_predicted_price - current_price + 100
            else:
                diff = avg_predicted_price - current_price + 30
            
            if diff > threshold:
                return "rising" 
            elif diff < -threshold:
                return "falling"
            else:
                return "stable"

        except Exception as e:
            logger.error(f"Error predicting trend: {e}")
            return "stable"

# Singleton instance
price_predictor = PricePredictorService()
