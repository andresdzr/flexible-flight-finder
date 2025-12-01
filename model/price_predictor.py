import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error
import matplotlib.pyplot as plt
import seaborn as sns

PRICE_THRESHOLD = 250

# ==========================================
# 1. LOAD DATA
# ==========================================
# Replace these filenames with your actual file paths
print("Loading data...")
# Assuming the 200k file is your training data
df_train = pd.read_csv('./data/2.csv') 
df_test = pd.read_csv('./data/test3.csv')

print(f"Training Shape: {df_train.shape}")
print(f"Testing Shape: {df_test.shape}")

# ==========================================
# 2. FEATURE ENGINEERING & PREPROCESSING
# ==========================================

def preprocess_data(df):
    # Filter out prices above the threshold (€250) to remove outliers
    df = df[df['Price_in_€'] <= PRICE_THRESHOLD].copy()
    
    # List all columns we want to remove from the feature set (X)
    cols_to_drop = ['Price_in_€']
    
    # Drop the original columns that were replaced by enriched features
    if 'Date' in df.columns:
        cols_to_drop.append('Date')
    if 'Origin' in df.columns:
        cols_to_drop.append('Origin')
    if 'Destination' in df.columns:
        cols_to_drop.append('Destination')
    if 'Day' in df.columns: # Dropping Day is okay since Weekday/Month cover seasonality
        cols_to_drop.append('Day')
    if 'Year' in df.columns:
        cols_to_drop.append('Year')
        
    cols_to_drop.append('Origin_Region')
    cols_to_drop.append('Destination_Region')

    # distinct features and target
    X = df.drop(columns=cols_to_drop, errors='ignore')
    y = df['Price_in_€']
    
    return X, y

X_train_raw, y_train = preprocess_data(df_train)
X_test_raw, y_test = preprocess_data(df_test)

# ==========================================
# 3. ENCODING CATEGORICAL VARIABLES
# ==========================================
print("Encoding categorical variables...")

# categorical_cols = ['Weekday', 'Origin_Region', 'Destination_Region']
categorical_cols = ['Weekday']

# We use One-Hot Encoding (get_dummies) for categorical columns.
X_train_enc = pd.get_dummies(X_train_raw, columns=categorical_cols)
X_test_enc = pd.get_dummies(X_test_raw, columns=categorical_cols)

# This ensures both datasets have exactly the same columns in the same order.
X_train, X_test = X_train_enc.align(X_test_enc, join='left', axis=1, fill_value=0)

print(f"Final Feature Count: {X_train.shape[1]}")
print(f"Final Features List: {X_train.columns.tolist()}")

print(f"Final Feature Count: {X_train.shape[1]}")

# ==========================================
# 4. MODEL TRAINING (XGBoost)
# ==========================================
print("Training XGBoost Model...")

# Initialize the Regressor
model = xgb.XGBRegressor(
    n_estimators=1000,
    learning_rate=0.1,
    max_depth=7,            # Depth of trees (higher = more complex)
    subsample=0.75,          # Use 80% of rows per tree to prevent overfitting
    colsample_bytree=0.75,   # Use 80% of columns per tree
    random_state=42,
    n_jobs=-1,               # Use all CPU cores
    early_stopping_rounds=100, # Stop if test error doesn't improve for 50 rounds
)

# Fit the model
model.fit(
    X_train, y_train,
    eval_set=[(X_train, y_train), (X_test, y_test)],
    verbose=100               # Print progress every 100 rounds
)

# ==========================================
# 5. EVALUATION
# ==========================================
print("Evaluating Performance...")

# Make predictions
predictions = model.predict(X_test)

# Calculate Metrics
mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(mean_squared_error(y_test, predictions))

print("\n" + "="*30)
print(f"Mean Absolute Error (MAE): €{mae:.2f}")
print(f"Root Mean Sq Error (RMSE): €{rmse:.2f}")
print("="*30 + "\n")

# Interpretation
print(f"On average, the model's prediction is off by €{mae:.2f}.")

# ==========================================
# 6. VISUALIZATION
# ==========================================
# Plot 1: Feature Importance (What drives the price?)
plt.figure(figsize=(10, 6))
xgb.plot_importance(model, max_num_features=15, height=0.5)
plt.title('Top 15 Most Important Features')
plt.tight_layout()
plt.savefig('feature_importance.png')
print("Saved feature_importance.png")

# Plot 2: Actual vs Predicted Prices (Subset of 100 points for clarity)
plt.figure(figsize=(12, 6))
subset_idx = np.random.choice(len(y_test), 100, replace=False)
plt.plot(y_test.iloc[subset_idx].values, label='Actual Price', marker='o')
plt.plot(predictions[subset_idx], label='Predicted Price', marker='x', linestyle='--')
plt.title('Actual vs Predicted Prices (Random 100 samples)')
plt.ylabel('Price in €')
plt.legend()
plt.grid(True, alpha=0.3)
plt.savefig('prediction_comparison.png')
print("Saved prediction_comparison.png")