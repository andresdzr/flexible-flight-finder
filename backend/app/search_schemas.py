from pydantic import BaseModel, Field
from typing import Optional
from app.schemas import FlightDetail, City


class FlightSearchRequest(BaseModel):
    min_days: Optional[int] = Field(None, description="Minimum trip duration in days")
    max_days: Optional[int] = Field(None, description="Maximum trip duration in days")
    start_month: Optional[str] = Field(None, description="Start month for search")
    end_month: Optional[str] = Field(None, description="End month for search")
    max_price: Optional[float] = Field(None, description="Maximum price in Euros")
    non_stop: Optional[bool] = Field(False, description="Only non-stop flights")
    one_way: Optional[bool] = Field(False, description="One way only")
    multicity: Optional[bool] = Field(False, description="Multicity trip optimization")


class FlightSearchResponse(BaseModel):
    flights: list[FlightDetail] = Field(..., description="List of found flights")
    count: int = Field(..., description="Number of flights found")


class MulticityLeg(BaseModel):
    """Single leg of a multicity trip."""

    origin: str = Field(..., description="Origin city name")
    destination: str = Field(..., description="Destination city name")
    price: float = Field(..., description="Price for this leg")


class MulticityTrip(BaseModel):
    """Complete multicity trip with multiple legs."""

    origin: str = Field(..., description="Starting city")
    visited_cities: list[str] = Field(..., description="List of all visited cities")
    legs: list[MulticityLeg] = Field(..., description="Flight legs in order")
    total_cost: float = Field(..., description="Total cost of the trip")
    total_cities: int = Field(..., description="Number of cities visited")


class MulticitySearchResponse(BaseModel):
    """Response for multicity search."""

    trip: Optional[MulticityTrip] = Field(None, description="Optimized multicity trip")
    status: str = Field(..., description="Status of the optimization")
    message: Optional[str] = Field(None, description="Additional information")
