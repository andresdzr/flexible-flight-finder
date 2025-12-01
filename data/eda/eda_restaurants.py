import polars as pl
import ast
from pathlib import Path

# Define the path to restaurants data
data_file = Path("./data/restaurants/TA_restaurants_curated.csv")

print(f"Loading restaurant dataset from: {data_file}")
print(f"{'='*80}")

# Load the dataset
df = pl.read_csv(data_file)

print(f"\n{'='*80}")
print(f"DATASET OVERVIEW")
print(f"{'='*80}")
print(f"Total rows: {df.shape[0]:,}")
print(f"Total columns: {df.shape[1]}")
print(f"\nColumns: {df.columns}")
print(f"\nColumn types:")
print(df.dtypes)

print(f"\n{'='*80}")
print(f"FIRST 5 ROWS")
print(f"{'='*80}")
print(df.head(5))

print(f"\n{'='*80}")
print(f"SUMMARY STATISTICS")
print(f"{'='*80}")
print(df.describe())

print(f"\n{'='*80}")
print(f"MISSING VALUES")
print(f"{'='*80}")
null_counts = df.null_count()
print(null_counts)

# Calculate percentage of missing values
total_rows = df.shape[0]
print(f"\nMissing value percentages:")
for col in df.columns:
    null_count = df[col].null_count()
    percentage = (null_count / total_rows) * 100
    if percentage > 0:
        print(f"  {col}: {percentage:.2f}% ({null_count:,} out of {total_rows:,})")

print(f"\n{'='*80}")
print(f"CITY DISTRIBUTION")
print(f"{'='*80}")
city_counts = (
    df.group_by("City")
    .agg(pl.len().alias("count"))
    .sort("count", descending=True)
)
print(city_counts)

print(f"\n{'='*80}")
print(f"RATING DISTRIBUTION")
print(f"{'='*80}")
rating_counts = (
    df.group_by("Rating")
    .agg(pl.len().alias("count"))
    .sort("Rating", descending=True)
)
print(rating_counts)

print(f"\n{'='*80}")
print(f"RATING STATISTICS BY CITY")
print(f"{'='*80}")
rating_by_city = (
    df.group_by("City")
    .agg(
        [
            pl.col("Rating").mean().alias("avg_rating"),
            pl.col("Rating").median().alias("median_rating"),
            pl.col("Rating").min().alias("min_rating"),
            pl.col("Rating").max().alias("max_rating"),
            pl.col("Rating").std().alias("std_rating"),
            pl.len().alias("count"),
        ]
    )
    .sort("avg_rating", descending=True)
)
print(rating_by_city)

print(f"\n{'='*80}")
print(f"PRICE RANGE DISTRIBUTION")
print(f"{'='*80}")
price_counts = (
    df.group_by("Price Range")
    .agg(pl.len().alias("count"))
    .sort("count", descending=True)
)
print(price_counts)

print(f"\n{'='*80}")
print(f"PRICE RANGE BY CITY")
print(f"{'='*80}")
price_by_city = (
    df.group_by(["City", "Price Range"])
    .agg(pl.len().alias("count"))
    .sort(["City", "count"], descending=[False, True])
)
print(price_by_city)

print(f"\n{'='*80}")
print(f"AVERAGE RATING BY PRICE RANGE")
print(f"{'='*80}")
rating_by_price = (
    df.group_by("Price Range")
    .agg(
        [
            pl.col("Rating").mean().alias("avg_rating"),
            pl.col("Rating").median().alias("median_rating"),
            pl.len().alias("count"),
        ]
    )
    .sort("avg_rating", descending=True)
)
print(rating_by_price)

print(f"\n{'='*80}")
print(f"NUMBER OF REVIEWS ANALYSIS")
print(f"{'='*80}")
reviews_stats = df.select(
    [
        pl.col("Number of Reviews").mean().alias("avg_reviews"),
        pl.col("Number of Reviews").median().alias("median_reviews"),
        pl.col("Number of Reviews").min().alias("min_reviews"),
        pl.col("Number of Reviews").max().alias("max_reviews"),
        pl.col("Number of Reviews").std().alias("std_reviews"),
    ]
)
print(reviews_stats)

print(f"\n{'='*80}")
print(f"REVIEWS BY CITY")
print(f"{'='*80}")
reviews_by_city = (
    df.group_by("City")
    .agg(
        [
            pl.col("Number of Reviews").mean().alias("avg_reviews"),
            pl.col("Number of Reviews").median().alias("median_reviews"),
            pl.col("Number of Reviews").sum().alias("total_reviews"),
            pl.len().alias("restaurant_count"),
        ]
    )
    .sort("avg_reviews", descending=True)
)
print(reviews_by_city)

print(f"\n{'='*80}")
print(f"TOP 20 RESTAURANTS BY NUMBER OF REVIEWS")
print(f"{'='*80}")
top_reviewed = (
    df.select(["Name", "City", "Rating", "Number of Reviews", "Price Range"])
    .sort("Number of Reviews", descending=True)
    .head(20)
)
print(top_reviewed)

print(f"\n{'='*80}")
print(f"TOP 20 RESTAURANTS BY RATING (with at least 100 reviews)")
print(f"{'='*80}")
top_rated = (
    df.filter(pl.col("Number of Reviews") >= 100)
    .select(["Name", "City", "Rating", "Number of Reviews", "Price Range"])
    .sort(["Rating", "Number of Reviews"], descending=[True, True])
    .head(20)
)
print(top_rated)

print(f"\n{'='*80}")
print(f"RANKING ANALYSIS")
print(f"{'='*80}")
ranking_stats = df.select(
    [
        pl.col("Ranking").mean().alias("avg_ranking"),
        pl.col("Ranking").median().alias("median_ranking"),
        pl.col("Ranking").min().alias("min_ranking"),
        pl.col("Ranking").max().alias("max_ranking"),
    ]
)
print(ranking_stats)

print(f"\n{'='*80}")
print(f"TOP 10 RESTAURANTS BY RANKING IN EACH CITY")
print(f"{'='*80}")
for city in sorted(df["City"].unique().to_list()):
    print(f"\n{city.upper()}:")
    city_top10 = (
        df.filter(pl.col("City") == city)
        .select(["Name", "Ranking", "Rating", "Price Range", "Number of Reviews"])
        .sort("Ranking")
        .head(10)
    )
    print(city_top10)

# Cuisine style analysis (parse list-like strings)
print(f"\n{'='*80}")
print(f"CUISINE STYLE ANALYSIS")
print(f"{'='*80}")

# Extract individual cuisines from the Cuisine Style column
cuisine_list = []
for cuisine_str in df["Cuisine Style"].drop_nulls():
    try:
        # Parse the string representation of list
        cuisines = ast.literal_eval(cuisine_str)
        if isinstance(cuisines, list):
            cuisine_list.extend(cuisines)
    except:
        # Skip if parsing fails
        pass

# Count cuisine occurrences
if cuisine_list:
    cuisine_df = pl.DataFrame({"cuisine": cuisine_list})
    cuisine_counts = (
        cuisine_df.group_by("cuisine")
        .agg(pl.len().alias("count"))
        .sort("count", descending=True)
        .head(30)
    )
    print(f"\nTop 30 most common cuisine styles:")
    print(cuisine_counts)
else:
    print("No cuisine data available")

print(f"\n{'='*80}")
print(f"CORRELATION: RATING vs NUMBER OF REVIEWS")
print(f"{'='*80}")
correlation = df.select(
    pl.corr("Rating", "Number of Reviews").alias("rating_reviews_correlation")
)
print(correlation)

print(f"\n{'='*80}")
print(f"RESTAURANTS WITH MISSING RATINGS")
print(f"{'='*80}")
missing_rating = df.filter(pl.col("Rating").is_null())
print(f"Count: {missing_rating.shape[0]:,}")
if missing_rating.shape[0] > 0:
    print("\nSample:")
    print(missing_rating.select(["Name", "City", "Number of Reviews"]).head(10))

print(f"\n{'='*80}")
print(f"RESTAURANTS WITH MISSING PRICE RANGE")
print(f"{'='*80}")
missing_price = df.filter(pl.col("Price Range").is_null())
print(f"Count: {missing_price.shape[0]:,}")
if missing_price.shape[0] > 0:
    print("\nSample:")
    print(missing_price.select(["Name", "City", "Rating", "Number of Reviews"]).head(10))

print(f"\n{'='*80}")
print(f"ANALYSIS COMPLETE")
print(f"{'='*80}")
