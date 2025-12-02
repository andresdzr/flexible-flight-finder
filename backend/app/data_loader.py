import json
import os
import time
from pathlib import Path
from typing import Optional

import polars as pl
import requests
from app.schemas import City, Coordinates


class DataLoader:
    """Service for loading and managing flight data."""

    def __init__(self, csv_path: str, cache_path: str = "geocode_cache.json"):
        self.csv_path = csv_path
        self.cache_path = cache_path
        self.df: Optional[pl.DataFrame] = None
        self.geocode_cache: dict[str, Coordinates] = {}
        self._load_geocode_cache()

    def _load_geocode_cache(self):
        """Load geocoding cache from file if it exists."""
        if os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    cache_data = json.load(f)
                    self.geocode_cache = {
                        city: Coordinates(lat=coords["lat"], lon=coords["lon"])
                        for city, coords in cache_data.items()
                    }
                print(f"Loaded {len(self.geocode_cache)} cities from geocode cache")
            except Exception as e:
                print(f"Error loading geocode cache: {e}")
                self.geocode_cache = {}

    def _save_geocode_cache(self):
        """Save geocoding cache to file."""
        try:
            cache_data = {
                city: {"lat": coords.lat, "lon": coords.lon}
                for city, coords in self.geocode_cache.items()
            }
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, indent=2)
            print(f"Saved {len(self.geocode_cache)} cities to geocode cache")
        except Exception as e:
            print(f"Error saving geocode cache: {e}")

    def _geocode_city(self, city_name: str) -> Optional[Coordinates]:
        """
        Geocode a city name using OpenStreetMap Nominatim API.
        Respects rate limiting (1 request per second).
        """
        if city_name in self.geocode_cache:
            return self.geocode_cache[city_name]

        try:
            # Nominatim requires a user agent
            headers = {"User-Agent": "FlightAnalytics/1.0 (Educational Project)"}

            # Search for the city
            url = "https://nominatim.openstreetmap.org/search"
            params = {"q": city_name, "format": "json", "limit": 1, "addressdetails": 0}

            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()

            data = response.json()
            if data and len(data) > 0:
                coords = Coordinates(
                    lat=float(data[0]["lat"]), lon=float(data[0]["lon"])
                )
                self.geocode_cache[city_name] = coords
                print(f"Geocoded {city_name}: ({coords.lat}, {coords.lon})")

                # Respect rate limit: 1 request per second
                time.sleep(1)

                return coords
            else:
                print(f"No geocoding results for {city_name}")
                return None

        except Exception as e:
            print(f"Error geocoding {city_name}: {e}")
            return None

    def load_data(self) -> pl.DataFrame:
        """Load flight data from CSV file using Polars."""
        print(f"Loading data from {self.csv_path}...")

        # Convert to absolute path
        csv_path = Path(self.csv_path)
        if not csv_path.is_absolute():
            # Resolve relative to backend directory
            backend_dir = Path(__file__).parent.parent
            csv_path = (backend_dir / self.csv_path).resolve()

        if not csv_path.exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")

        # Load CSV with Polars
        self.df = pl.read_csv(
            csv_path,
            dtypes={
                "Origin": pl.Utf8,
                "Destination": pl.Utf8,
                "Date": pl.Date,
                "Price_in_€": pl.Int64,
                "Distance_km": pl.Int64,
                "Year": pl.Int64,
                "Month": pl.Int64,
                "Day": pl.Int64,
                "Weekday": pl.Utf8,
                "Days_until_departure": pl.Int64,
            },
        )

        if "Price_in_€" in self.df.columns:
            self.df = self.df.rename({"Price_in_€": "Price_in_EUR"})
            print("Renamed 'Price_in_€' column to 'Price_in_EUR'")

        print(self.df.head())

        print(f"Loaded {len(self.df)} flight records")
        print(f"Columns: {self.df.columns}")

        # Get unique cities
        unique_cities = set(
            self.df["Origin"].unique().to_list()
            + self.df["Destination"].unique().to_list()
        )
        print(f"Found {len(unique_cities)} unique cities")

        # Geocode all cities
        print("Geocoding cities...")
        for city in sorted(unique_cities):
            if city not in self.geocode_cache:
                self._geocode_city(city)

        # Save cache after geocoding
        self._save_geocode_cache()

        return self.df

    def get_city(self, city_name: str) -> Optional[City]:
        """Get City object with coordinates for a given city name."""
        coords = self.geocode_cache.get(city_name)
        if coords:
            return City(name=city_name, coords=coords)
        return None

    def get_all_cities(self) -> list[City]:
        """Get all cities with coordinates."""
        return [
            City(name=city_name, coords=coords)
            for city_name, coords in self.geocode_cache.items()
        ]

    def calculate_price_statistics(
        self, prices: list[float], exclude_high_outliers: bool = True
    ) -> tuple[float, float, float, float]:
        """
        Calculate price statistics, optionally excluding high outliers.
        Returns (mean, median, min, max) after filtering.
        """
        if not prices:
            return 0.0, 0.0, 0.0, 0.0

        prices_series = pl.Series(prices)

        if exclude_high_outliers and len(prices) > 10:
            # Exclude top 10% as high outliers, but keep low outliers
            threshold = prices_series.quantile(0.90)
            filtered_prices = prices_series.filter(prices_series <= threshold)

            if len(filtered_prices) > 0:
                return (
                    float(filtered_prices.mean()),
                    float(filtered_prices.median()),
                    float(filtered_prices.min()),
                    float(filtered_prices.max()),
                )

        return (
            float(prices_series.mean()),
            float(prices_series.median()),
            float(prices_series.min()),
            float(prices_series.max()),
        )

    def categorize_price_relative(
        self, avg_price: float, all_avg_prices: list[float]
    ) -> str:
        """
        Categorize price relative to all prices using percentiles.
        Returns price_range category.
        """
        if not all_avg_prices:
            return "moderate"

        prices_series = pl.Series(all_avg_prices)

        # Calculate percentile thresholds
        p25 = float(prices_series.quantile(0.25))
        p50 = float(prices_series.quantile(0.50))
        p75 = float(prices_series.quantile(0.75))

        # Categorize based on quartiles
        if avg_price <= p25:
            return "budget"
        elif avg_price <= p50:
            return "moderate"
        elif avg_price <= p75:
            return "expensive"
        else:
            return "premium"


# Global instance
data_loader: Optional[DataLoader] = None


def get_data_loader() -> DataLoader:
    """Get the global data loader instance."""
    if data_loader is None:
        raise RuntimeError("Data loader not initialized")
    return data_loader
