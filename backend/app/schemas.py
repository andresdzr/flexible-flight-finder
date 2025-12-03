from pydantic import BaseModel, Field
from typing import Optional


class Coordinates(BaseModel):
    """Geographic coordinates for a city."""

    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")


class City(BaseModel):
    """City information with name and coordinates."""

    name: str = Field(..., description="City name")
    country_code: Optional[str] = Field(None, description="ISO 3166-1 alpha-2 country code")
    coords: Coordinates = Field(..., description="Geographic coordinates")


class CityPricing(BaseModel):
    """Average pricing information for a destination city."""

    city: City = Field(..., description="City information")
    average_price: float = Field(..., description="Average flight price to this city")
    median_price: float = Field(..., description="Median flight price to this city")
    min_price: float = Field(..., description="Minimum flight price to this city")
    price_range: str = Field(
        ..., description="Price category (budget, moderate, expensive, premium)"
    )
    flight_count: int = Field(..., description="Number of flights to this city")


class FlightRoute(BaseModel):
    """Price information for flights to a specific destination."""

    origin: City = Field(..., description="Origin city")
    destination: City = Field(..., description="Destination city")
    avg_price: float = Field(..., description="Average price for this route")
    median_price: float = Field(..., description="Median price for this route")
    min_price: float = Field(..., description="Minimum price for this route")
    max_price: float = Field(..., description="Maximum price for this route")
    flight_count: int = Field(..., description="Number of flights on this route")


class FlightDetail(BaseModel):
    """Detailed information about a specific flight."""

    origin: City = Field(..., description="Origin city")
    destination: City = Field(..., description="Destination city")
    date: str = Field(..., description="Flight date (YYYY-MM-DD)")
    price: float = Field(..., description="Flight price in EUR")
    distance_km: int = Field(..., description="Flight distance in kilometers")
    weekday: str = Field(..., description="Day of the week")
    year: int = Field(..., description="Year")
    month: int = Field(..., description="Month")
    day: int = Field(..., description="Day of month")
    return_date: Optional[str] = Field(None, description="Return date (YYYY-MM-DD)")
    price_trend: Optional[str] = Field(
        "stable", description="Price trend: 'rising', 'falling', or 'stable'"
    )


class CityPricingResponse(BaseModel):
    """Response model for city pricing endpoint."""

    cities: list[CityPricing] = Field(
        ..., description="List of cities with pricing info"
    )
    total_cities: int = Field(..., description="Total number of cities")


class CityFlightsResponse(BaseModel):
    """Response model for city flights endpoint."""

    origin_city: City = Field(..., description="Origin city")
    routes: list[FlightRoute] = Field(..., description="Routes from this city")
    cheapest_flights: list[FlightDetail] = Field(
        ..., description="Top 5 cheapest flights"
    )
    total_routes: int = Field(..., description="Total number of destination cities")


class RouteFlights(BaseModel):
    """Flights for a specific route."""

    origin: City = Field(..., description="Origin city")
    destination: City = Field(..., description="Destination city")
    cheapest_flights: list[FlightDetail] = Field(
        ..., description="Top 10 cheapest flights for this route"
    )
    flight_count: int = Field(..., description="Total number of flights on this route")


class CheapestFlightsPerRouteResponse(BaseModel):
    """Response model for cheapest flights per route endpoint."""

    routes: list[RouteFlights] = Field(
        ..., description="All routes with their top 10 cheapest flights"
    )
    total_routes: int = Field(..., description="Total number of routes")


class CalendarDayPrice(BaseModel):
    """Price statistics for a specific day."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    avg_price: float = Field(..., description="Average price for this day")
    median_price: float = Field(..., description="Median price for this day")
    min_price: float = Field(..., description="Minimum price for this day")
    max_price: float = Field(..., description="Maximum price for this day")
    flight_count: int = Field(..., description="Number of flights on this day")


class CheapestRoute(BaseModel):
    """Route with pricing statistics."""

    origin: City = Field(..., description="Origin city")
    destination: City = Field(..., description="Destination city")
    median_price: float = Field(..., description="Median price for this route")
    min_price: float = Field(..., description="Minimum price for this route")
    avg_price: float = Field(..., description="Average price for this route")
    max_price: float = Field(..., description="Maximum price for this route")
    flight_count: int = Field(..., description="Number of flights on this route")
    distance_km: float = Field(..., description="Average distance in kilometers")


class WeekdayStats(BaseModel):
    """Price statistics by weekday."""

    weekday: str = Field(..., description="Day of the week")
    avg_price: float = Field(..., description="Average price")
    median_price: float = Field(..., description="Median price")
    min_price: float = Field(..., description="Minimum price")
    max_price: float = Field(..., description="Maximum price")
    flight_count: int = Field(..., description="Number of flights")


class MonthlyStats(BaseModel):
    """Price statistics by month."""

    year: int = Field(..., description="Year")
    month: int = Field(..., description="Month (1-12)")
    month_name: str = Field(..., description="Month name")
    avg_price: float = Field(..., description="Average price")
    median_price: float = Field(..., description="Median price")
    min_price: float = Field(..., description="Minimum price")
    max_price: float = Field(..., description="Maximum price")
    flight_count: int = Field(..., description="Number of flights")


class PriceDistribution(BaseModel):
    """Price distribution data."""

    bucket: str = Field(..., description="Price range bucket (e.g., '0-50')")
    count: int = Field(..., description="Number of flights in this bucket")
    percentage: float = Field(..., description="Percentage of total flights")


class StatisticsMetadata(BaseModel):
    """Metadata about the statistics."""

    total_flights: int = Field(..., description="Total number of flights analyzed")
    total_routes: int = Field(..., description="Total number of unique routes")
    date_range_start: str = Field(..., description="Start date of data")
    date_range_end: str = Field(..., description="End date of data")
    computed_at: str = Field(..., description="When statistics were computed")
    cache_hit: bool = Field(..., description="Whether data was from cache")


class StatisticsResponse(BaseModel):
    """Response model for statistics endpoint."""

    calendar_data: list[CalendarDayPrice] = Field(
        ..., description="Daily price data for calendar heatmap"
    )
    cheapest_routes: list[CheapestRoute] = Field(
        ..., description="Top 20 cheapest routes by median price"
    )
    weekday_stats: list[WeekdayStats] = Field(
        ..., description="Price statistics by weekday"
    )
    monthly_stats: list[MonthlyStats] = Field(
        ..., description="Price statistics by month"
    )
    price_distribution: list[PriceDistribution] = Field(
        ..., description="Price distribution buckets"
    )
    metadata: StatisticsMetadata = Field(..., description="Metadata about statistics")
