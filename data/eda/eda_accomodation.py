import polars as pl
import os
from pathlib import Path

# Define the path to accommodation data
data_dir = Path("./data/accomodation")

# Get all CSV files
csv_files = sorted(data_dir.glob("*.csv"))
print(f"Found {len(csv_files)} accommodation datasets:\n")

# Load and merge all datasets
dfs = []
for csv_file in csv_files:
    # Extract city and day_type from filename
    filename = csv_file.stem  # e.g., "amsterdam_weekdays"
    parts = filename.split("_")
    city = parts[0]
    day_type = parts[1]

    # Load the dataframe with infer_schema_length=0 to read all as strings first
    df = pl.read_csv(csv_file, infer_schema_length=0)

    # Add city and day_type columns
    df = df.with_columns(
        [pl.lit(city).alias("city"), pl.lit(day_type).alias("day_type")]
    )

    dfs.append(df)
    print(f"  - {filename}.csv: {df.shape[0]} rows")

# Merge all dataframes (now all strings, so compatible)
df_merged = pl.concat(dfs, how="vertical")

# Convert numeric columns to proper types after merging
numeric_columns = [
    "realSum",
    "person_capacity",
    "multi",
    "biz",
    "cleanliness_rating",
    "guest_satisfaction_overall",
    "bedrooms",
    "dist",
    "metro_dist",
    "attr_index",
    "attr_index_norm",
    "rest_index",
    "rest_index_norm",
    "lng",
    "lat",
]

# Convert to float64 for numeric columns (handles both int and float)
for col in numeric_columns:
    if col in df_merged.columns:
        df_merged = df_merged.with_columns(pl.col(col).cast(pl.Float64, strict=False))

# Convert boolean columns (from string "True"/"False" to boolean)
boolean_columns = ["room_shared", "room_private", "host_is_superhost"]
for col in boolean_columns:
    if col in df_merged.columns:
        df_merged = df_merged.with_columns((pl.col(col) == "True").alias(col))

print(f"\n{'='*80}")
print(f"MERGED DATASET")
print(f"{'='*80}")
print(f"Total rows: {df_merged.shape[0]:,}")
print(f"Total columns: {df_merged.shape[1]}")
print(f"\nColumns: {df_merged.columns}")

print(f"\n{'='*80}")
print(f"DATASET OVERVIEW")
print(f"{'='*80}")
print(f"\nFirst 10 rows:")
print(df_merged.head(10))

print(f"\n{'='*80}")
print(f"SUMMARY STATISTICS")
print(f"{'='*80}")
print(df_merged.describe())

print(f"\n{'='*80}")
print(f"MISSING VALUES")
print(f"{'='*80}")
null_counts = df_merged.null_count()
print(null_counts)

print(f"\n{'='*80}")
print(f"CITY DISTRIBUTION")
print(f"{'='*80}")
city_counts = (
    df_merged.group_by("city")
    .agg(pl.len().alias("count"))
    .sort("count", descending=True)
)
print(city_counts)

print(f"\n{'='*80}")
print(f"DAY TYPE DISTRIBUTION")
print(f"{'='*80}")
day_type_counts = (
    df_merged.group_by("day_type")
    .agg(pl.len().alias("count"))
    .sort("count", descending=True)
)
print(day_type_counts)

print(f"\n{'='*80}")
print(f"CITY x DAY TYPE DISTRIBUTION")
print(f"{'='*80}")
cross_counts = (
    df_merged.group_by(["city", "day_type"])
    .agg(pl.len().alias("count"))
    .sort(["city", "day_type"])
)
print(cross_counts)

print(f"\n{'='*80}")
print(f"ROOM TYPE DISTRIBUTION")
print(f"{'='*80}")
room_type_counts = (
    df_merged.group_by("room_type")
    .agg(pl.len().alias("count"))
    .sort("count", descending=True)
)
print(room_type_counts)

print(f"\n{'='*80}")
print(f"PRICE ANALYSIS BY CITY")
print(f"{'='*80}")
price_by_city = (
    df_merged.group_by("city")
    .agg(
        [
            pl.col("realSum").mean().alias("avg_price"),
            pl.col("realSum").median().alias("median_price"),
            pl.col("realSum").min().alias("min_price"),
            pl.col("realSum").max().alias("max_price"),
            pl.col("realSum").std().alias("std_price"),
        ]
    )
    .sort("avg_price", descending=True)
)
print(price_by_city)

print(f"\n{'='*80}")
print(f"PRICE ANALYSIS BY DAY TYPE")
print(f"{'='*80}")
price_by_day = (
    df_merged.group_by("day_type")
    .agg(
        [
            pl.col("realSum").mean().alias("avg_price"),
            pl.col("realSum").median().alias("median_price"),
            pl.col("realSum").min().alias("min_price"),
            pl.col("realSum").max().alias("max_price"),
        ]
    )
    .sort("avg_price", descending=True)
)
print(price_by_day)

print(f"\n{'='*80}")
print(f"GUEST SATISFACTION BY CITY")
print(f"{'='*80}")
satisfaction_by_city = (
    df_merged.group_by("city")
    .agg(
        [
            pl.col("guest_satisfaction_overall").mean().alias("avg_satisfaction"),
            pl.col("guest_satisfaction_overall").median().alias("median_satisfaction"),
            pl.len().alias("count"),
        ]
    )
    .sort("avg_satisfaction", descending=True)
)
print(satisfaction_by_city)

print(f"\n{'='*80}")
print(f"SUPERHOST ANALYSIS")
print(f"{'='*80}")
superhost_stats = df_merged.group_by("host_is_superhost").agg(
    [
        pl.len().alias("count"),
        pl.col("realSum").mean().alias("avg_price"),
        pl.col("guest_satisfaction_overall").mean().alias("avg_satisfaction"),
    ]
)
print(superhost_stats)

print(f"\n{'='*80}")
print(f"ANALYSIS COMPLETE")
print(f"{'='*80}")
