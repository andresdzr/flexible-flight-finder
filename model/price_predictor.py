import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
import glob
import os
import joblib

PRICE_THRESHOLD = 300
DATA_DIR = "./data"

# 1. LOAD AND MERGE DATA
print("Loading data...")

# Get a list of all CSV files in the data directory
all_files = glob.glob(os.path.join(DATA_DIR, "*.csv"))

# Exclude the output file from the input list to avoid recursive loading
output_file = os.path.join(DATA_DIR, "european_flight_data_enriched.csv")
if output_file in all_files:
    all_files.remove(output_file)

if not all_files:
    raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")

print(f"Found {len(all_files)} files: {[os.path.basename(f) for f in all_files]}")

# Read each file and append to a list
df_list = []
for filename in all_files:
    df = pd.read_csv(filename)
    # Standardize price column name
    if "Price_in_€" in df.columns:
        df.rename(columns={"Price_in_€": "Price_in_EUR"}, inplace=True)
    df["Price_in_EUR"] = df["Price_in_EUR"].astype(float).astype(int)
    df["Distance_km"] = df["Distance_km"].astype(float).astype(int)
    df = df[df["Price_in_EUR"] <= PRICE_THRESHOLD].copy()


    df_list.append(df)

# Concatenate all dataframes
# pd.concat automatically aligns columns by name, even if they are in different orders
df_full = pd.concat(df_list, axis=0, ignore_index=True)

print(f"Total Combined Shape: {df_full.shape}")

df_full.to_csv("./data/european_flight_data_enriched.csv", index=False)


# 2. FURTHER FEATURE ENGINEERING & PREPROCESSING
def preprocess_data(df):
    """
    Cleans the dataframe and separates Features (X) from Target (y).
    """
    df_clean = df.copy()

    # List all columns we want to remove from the feature set (X)
    # We remove the target 'Price_in_EUR' and irrelevant/redundant cols
    cols_to_drop = ["Price_in_EUR"]

    potential_drops = [
        "Date",
        "Origin",
        "Destination",
        "Day",
        "Year",
        "Origin_Country",
        "Destination_Country",
    ]

    for col in potential_drops:
        if col in df_clean.columns:
            cols_to_drop.append(col)

    # Separate Features and Target
    X = df_clean.drop(columns=cols_to_drop, errors="ignore")
    y = df_clean["Price_in_EUR"]

    return X, y


# Apply preprocessing to the full dataset
X_raw, y = preprocess_data(df_full)

print(f"Shape after preprocessing: {X_raw.shape}")

# 3. ENCODING & SPLITTING
print("Encoding categorical variables...")

categorical_cols = ["Weekday"]

# One-Hot Encoding on the full dataset
# This ensures that all categories present in the data are created as columns
X_encoded = pd.get_dummies(X_raw, columns=categorical_cols)

print(f"Final Feature Count: {X_encoded.shape[1]}")
print(f"Final Features List: {X_encoded.columns.tolist()}")

print("Splitting data into Train and Test sets...")

# Perform the random split (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y, test_size=0.3, random_state=42
)

print(f"Training Set: {X_train.shape}")
print(f"Test Set: {X_test.shape}")

# 4. MODEL TRAINING (XGBoost)
print("Training XGBoost Model...")

# Initialize the Regressor
model = xgb.XGBRegressor(
    n_estimators=1000,
    learning_rate=0.1,
    max_depth=7,
    subsample=0.75,
    colsample_bytree=0.75,
    random_state=42,
    n_jobs=-1,
    early_stopping_rounds=100,
)

# Fit the model
model.fit(
    X_train, y_train, eval_set=[(X_train, y_train), (X_test, y_test)], verbose=100
)

# 5. EVALUATION
print("Evaluating Performance...")

predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(mean_squared_error(y_test, predictions))

print("\n" + "=" * 30)
print(f"Mean Absolute Error (MAE): €{mae:.2f}")
print(f"Root Mean Sq Error (RMSE): €{rmse:.2f}")
print("=" * 30 + "\n")

print(f"On average, the model's prediction is off by €{mae:.2f}.")

# 6. VISUALIZATION
# Plot 1: Feature Importance
plt.figure(figsize=(10, 6))
xgb.plot_importance(model, max_num_features=15, height=0.5)
plt.title("Top 15 Most Important Features")
plt.tight_layout()
plt.savefig("feature_importance.png")
print("Saved feature_importance.png")

# Plot 2: Actual vs Predicted Prices (Subset of 100 points)
plt.figure(figsize=(12, 6))
# Ensure we don't try to sample more points than exist in the test set
sample_size = min(100, len(y_test))
subset_idx = np.random.choice(len(y_test), sample_size, replace=False)

# Need to use .iloc for y_test as it is a Series with potential index gaps
# predictions is a numpy array, so we slice it directly
plt.plot(y_test.iloc[subset_idx].values, label="Actual Price", marker="o")
plt.plot(predictions[subset_idx], label="Predicted Price", marker="x", linestyle="--")

plt.title(f"Actual vs Predicted Prices (Random {sample_size} samples)")
plt.ylabel("Price_in_EUR")
plt.legend()
plt.grid(True, alpha=0.3)
plt.savefig("prediction_comparison.png")
print("Saved prediction_comparison.png")

# 7. SAVE MODEL FOR DEPLOYMENT
print("Saving model and artifacts...")

# 1. Save the model object
joblib.dump(model, "flight_price_xgb_model.joblib")
print(" - Model saved to 'flight_price_xgb_model.joblib'")

# 2. Save the feature names
model_columns = list(X_train.columns)
joblib.dump(model_columns, "model_features.joblib")
print(" - Model features list saved to 'model_features.joblib'")
