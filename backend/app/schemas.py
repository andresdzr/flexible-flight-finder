from pydantic import BaseModel, Field
from typing import Optional


class Coordinates(BaseModel):
    """Geographic coordinates for a city."""

    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")


class City(BaseModel):
    """City information with name and coordinates."""

    name: str = Field(..., description="City name")
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
