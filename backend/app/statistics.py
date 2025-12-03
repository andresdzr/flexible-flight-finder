from fastapi import APIRouter, HTTPException, Query
import polars as pl
import json
from pathlib import Path
from datetime import datetime
from typing import Optional
from app.data_loader import get_data_loader
from app.schemas import (
    StatisticsResponse,
)

router = APIRouter(prefix="/api/statistics", tags=["statistics"])

CACHE_FILE = Path(__file__).parent.parent / "cache" / "statistics_cache.json"


def get_month_name(month: int) -> str:
    """Convert month number to month name."""
    months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    return months[month - 1] if 1 <= month <= 12 else "Unknown"


def compute_statistics(
    df: pl.DataFrame, start_date: Optional[str] = None, end_date: Optional[str] = None
) -> dict:
    """
    Compute all statistics from the flight data.

    Args:
        df: Polars DataFrame with flight data
        start_date: Optional start date filter (YYYY-MM-DD)
        end_date: Optional end date filter (YYYY-MM-DD)

    Returns:
        Dictionary with all computed statistics
    """
    loader = get_data_loader()

    filtered_df = df
    if start_date:
        filtered_df = filtered_df.filter(
            pl.col("Date") >= pl.lit(start_date).str.to_date()
        )
    if end_date:
        filtered_df = filtered_df.filter(
            pl.col("Date") <= pl.lit(end_date).str.to_date()
        )

    if len(filtered_df) == 0:
        raise ValueError("No flights found in the specified date range")

    date_range_start = str(filtered_df["Date"].min())
    date_range_end = str(filtered_df["Date"].max())

    # calendar data - daily average/median prices
    calendar_data = []
    dates = filtered_df["Date"].unique().sort().to_list()

    for date in dates:
        day_flights = filtered_df.filter(pl.col("Date") == date)
        prices = day_flights["Price_in_EUR"].to_list()

        if prices:
            avg_price, median_price, min_price, max_price = (
                loader.calculate_price_statistics(prices, exclude_high_outliers=False)
            )

            calendar_data.append(
                {
                    "date": str(date),
                    "avg_price": round(avg_price, 2),
                    "median_price": round(median_price, 2),
                    "min_price": round(min_price, 2),
                    "max_price": round(max_price, 2),
                    "flight_count": len(prices),
                }
            )

    # top 20 cheapest routes by median price
    cheapest_routes = []
    routes_df = (
        filtered_df.group_by(["Origin", "Destination"])
        .agg(
            [
                pl.col("Price_in_EUR").median().alias("median_price"),
                pl.col("Price_in_EUR").min().alias("min_price"),
                pl.col("Price_in_EUR").mean().alias("avg_price"),
                pl.col("Price_in_EUR").max().alias("max_price"),
                pl.col("Price_in_EUR").count().alias("flight_count"),
                pl.col("Distance_km").mean().alias("avg_distance"),
            ]
        )
        .sort("median_price")
        .head(20)
    )

    for row in routes_df.iter_rows(named=True):
        origin_city = loader.get_city(row["Origin"])
        dest_city = loader.get_city(row["Destination"])

        if origin_city and dest_city:
            cheapest_routes.append(
                {
                    "origin": {
                        "name": origin_city.name,
                        "coords": {
                            "lat": origin_city.coords.lat,
                            "lon": origin_city.coords.lon,
                        },
                    },
                    "destination": {
                        "name": dest_city.name,
                        "coords": {
                            "lat": dest_city.coords.lat,
                            "lon": dest_city.coords.lon,
                        },
                    },
                    "median_price": round(row["median_price"], 2),
                    "min_price": round(row["min_price"], 2),
                    "avg_price": round(row["avg_price"], 2),
                    "max_price": round(row["max_price"], 2),
                    "flight_count": int(row["flight_count"]),
                    "distance_km": round(row["avg_distance"], 2),
                }
            )

    # weekday price analysis
    weekday_order = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    weekday_stats = []
    weekday_df = filtered_df.group_by("Weekday").agg(
        [
            pl.col("Price_in_EUR").mean().alias("avg_price"),
            pl.col("Price_in_EUR").median().alias("median_price"),
            pl.col("Price_in_EUR").min().alias("min_price"),
            pl.col("Price_in_EUR").max().alias("max_price"),
            pl.col("Price_in_EUR").count().alias("flight_count"),
        ]
    )

    for weekday in weekday_order:
        day_data = weekday_df.filter(pl.col("Weekday") == weekday)
        if len(day_data) > 0:
            row = day_data.row(0, named=True)
            weekday_stats.append(
                {
                    "weekday": weekday,
                    "avg_price": round(row["avg_price"], 2),
                    "median_price": round(row["median_price"], 2),
                    "min_price": round(row["min_price"], 2),
                    "max_price": round(row["max_price"], 2),
                    "flight_count": int(row["flight_count"]),
                }
            )

    # monthly statistics
    monthly_stats = []
    monthly_df = (
        filtered_df.group_by(["Year", "Month"])
        .agg(
            [
                pl.col("Price_in_EUR").mean().alias("avg_price"),
                pl.col("Price_in_EUR").median().alias("median_price"),
                pl.col("Price_in_EUR").min().alias("min_price"),
                pl.col("Price_in_EUR").max().alias("max_price"),
                pl.col("Price_in_EUR").count().alias("flight_count"),
            ]
        )
        .sort(["Year", "Month"])
    )

    for row in monthly_df.iter_rows(named=True):
        monthly_stats.append(
            {
                "year": int(row["Year"]),
                "month": int(row["Month"]),
                "month_name": get_month_name(row["Month"]),
                "avg_price": round(row["avg_price"], 2),
                "median_price": round(row["median_price"], 2),
                "min_price": round(row["min_price"], 2),
                "max_price": round(row["max_price"], 2),
                "flight_count": int(row["flight_count"]),
            }
        )

    # price distribution
    price_buckets = [
        (0, 50),
        (50, 100),
        (100, 150),
        (150, 200),
        (200, 250),
        (250, 300),
        (300, 500),
        (500, 1000),
    ]

    total_flights = len(filtered_df)
    price_distribution = []

    for min_price, max_price in price_buckets:
        count = len(
            filtered_df.filter(
                (pl.col("Price_in_EUR") >= min_price)
                & (pl.col("Price_in_EUR") < max_price)
            )
        )
        if count > 0:
            percentage = round((count / total_flights) * 100, 2)
            price_distribution.append(
                {
                    "bucket": f"€{min_price}-{max_price}",
                    "count": count,
                    "percentage": percentage,
                }
            )

    # handle very high prices separately
    high_price_count = len(filtered_df.filter(pl.col("Price_in_EUR") >= 1000))
    if high_price_count > 0:
        percentage = round((high_price_count / total_flights) * 100, 2)
        price_distribution.append(
            {
                "bucket": "€1000+",
                "count": high_price_count,
                "percentage": percentage,
            }
        )

    unique_routes = filtered_df.select(["Origin", "Destination"]).unique().height

    return {
        "calendar_data": calendar_data,
        "cheapest_routes": cheapest_routes,
        "weekday_stats": weekday_stats,
        "monthly_stats": monthly_stats,
        "price_distribution": price_distribution,
        "metadata": {
            "total_flights": total_flights,
            "total_routes": unique_routes,
            "date_range_start": date_range_start,
            "date_range_end": date_range_end,
            "computed_at": datetime.utcnow().isoformat(),
            "cache_hit": False,
        },
    }


def load_from_cache(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Optional[dict]:
    """Load statistics from cache if available and valid."""
    if not CACHE_FILE.exists():
        return None

    try:
        with open(CACHE_FILE, "r") as f:
            cache_data = json.load(f)

        cached_filters = cache_data.get("filters", {})
        if (
            cached_filters.get("start_date") == start_date
            and cached_filters.get("end_date") == end_date
        ):
            # cache hit
            cache_data["statistics"]["metadata"]["cache_hit"] = True
            return cache_data["statistics"]

    except Exception as e:
        print(f"Error loading cache: {e}")

    return None


def save_to_cache(
    statistics: dict, start_date: Optional[str] = None, end_date: Optional[str] = None
):
    """Save statistics to cache file."""
    try:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

        cache_data = {
            "filters": {"start_date": start_date, "end_date": end_date},
            "statistics": statistics,
        }

        with open(CACHE_FILE, "w") as f:
            json.dump(cache_data, f, indent=2)

    except Exception as e:
        print(f"Error saving cache: {e}")


@router.get("", response_model=StatisticsResponse)
async def get_statistics(
    start_date: Optional[str] = Query(
        None, description="Start date filter (YYYY-MM-DD)"
    ),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    refresh: bool = Query(False, description="Force refresh cache"),
):
    """
    Get comprehensive flight statistics including:
    - Daily price data for calendar heatmap
    - Top 20 cheapest routes by median price
    - Weekday price trends
    - Monthly price trends
    - Price distribution

    Supports date range filtering and caching.
    Use ?refresh=true to force recalculation.
    """
    try:
        loader = get_data_loader()
        df = loader.df

        if df is None:
            raise HTTPException(status_code=500, detail="Data not loaded")

        # try to load from cache if not forcing refresh
        if not refresh:
            cached_stats = load_from_cache(start_date, end_date)
            if cached_stats:
                return StatisticsResponse(**cached_stats)

        statistics = compute_statistics(df, start_date, end_date)

        save_to_cache(statistics, start_date, end_date)

        return StatisticsResponse(**statistics)

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error computing statistics: {str(e)}"
        )
