# Flight Price Prediction Model

This directory contains the code and data for the flight price prediction model. The model uses XGBoost to predict flight prices based on various features such as origin, destination, date, and time until departure.

## Prerequisites

- Python 3.x

## Installation

1.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

### Training the Model

The main script `price_predictor.py` handles data loading, preprocessing, training, evaluation, and saving the model.

**Command:**

```bash
python price_predictor.py
```

**What it does:**

1.  **Loads Data:** Reads all CSV files from the `./data` directory and merges them into a single dataset.
2.  **Preprocessing:**
    *   Filters out outliers (prices > €250).
    *   Drops irrelevant columns.
    *   Separates features (X) and target (y).
3.  **Encoding:** One-hot encodes categorical variables (e.g., Weekday).
4.  **Splitting:** Splits data into training (80%) and testing (20%) sets.
5.  **Training:** Trains an XGBoost Regressor model.
6.  **Evaluation:** Calculates MAE and RMSE on the test set.
7.  **Visualization:** Generates `feature_importance.png` and `prediction_comparison.png`.
8.  **Saving:** Saves the trained model to `flight_price_xgb_model.joblib` and the feature names to `model_features.joblib`.

### Using the Model

To use the trained model in an application (like the backend API):

1.  Load the model and feature names:
    ```python
    import joblib
    model = joblib.load('flight_price_xgb_model.joblib')
    model_columns = joblib.load('model_features.joblib')
    ```

2.  Prepare input data as a DataFrame.
3.  One-hot encode categorical variables.
4.  Align columns with the training features:
    ```python
    input_df = input_df.reindex(columns=model_columns, fill_value=0)
    ```
5.  Predict:
    ```python
    price = model.predict(input_df)
    ```

## Files

-   `price_predictor.py`: Main script for training and evaluation.
-   `requirements.txt`: Python dependencies.
-   `data/`: Directory containing input CSV files.
-   `flight_price_xgb_model.joblib`: Saved XGBoost model.
-   `model_features.joblib`: Saved list of feature names.
-   `feature_importance.png`: Plot of top features.
-   `prediction_comparison.png`: Plot of actual vs predicted prices.
