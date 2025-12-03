import joblib
import os
import logging
from typing import List, Dict, Any, Optional
import polars as pl

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
        """Loads the XGBoost model and feature names from joblib files."""
        try:
            model_path = os.path.join(self.model_dir, "flight_price_xgb_model.joblib")
            features_path = os.path.join(self.model_dir, "model_features.joblib")

            if not os.path.exists(model_path) or not os.path.exists(features_path):
                logger.warning(
                    f"Model files not found in {self.model_dir}. Price prediction disabled."
                )
                return

            self.model = joblib.load(model_path)
            self.model_features = joblib.load(features_path)
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
                "Origin": [flight_data.get("origin")],
                "Destination": [flight_data.get("destination")],
                "Date": [flight_data.get("date")],
                "Distance_km": [flight_data.get("distance_km")],
                "Weekday": [flight_data.get("weekday")],
                "Year": [flight_data.get("year")],
                "Month": [flight_data.get("month")],
                "Day": [flight_data.get("day")],
                "Days_until_departure": [
                    flight_data.get("days_until_departure", 30)
                ],  # Default if missing
            }

            df = pl.DataFrame(input_data)

            # One-hot encode categorical variables (Weekday)
            # Note: We need to match the training columns exactly.
            # Since we only have one row, pd.get_dummies might not create all columns.
            # We need to reindex with the model features.

            df_encoded = df.to_dummies(columns=["Weekday"])

            # Reindex to match model features, filling missing with 0
            df_final = df_encoded.reindex(columns=self.model_features, fill_value=0)

            # Predict
            predicted_price = self.model.predict(df_final)[0]
            return float(predicted_price)

        except Exception as e:
            logger.error(f"Error predicting price: {e}")
            return None

    def check_superdeal(
        self, actual_price: float, predicted_price: float, threshold: float = 20.0
    ) -> tuple[bool, float]:
        """
        Checks if the flight is a super deal.
        Returns (is_superdeal, savings)
        """
        if predicted_price is None:
            return False, 0.0

        savings = predicted_price - actual_price
        is_superdeal = savings >= threshold

        return is_superdeal, savings if is_superdeal else 0.0


# Singleton instance
price_predictor = PricePredictorService()
