from pydantic import BaseModel, Field
from typing import Optional
from app.schemas import FlightDetail


class FlightSearchRequest(BaseModel):
    min_days: Optional[int] = Field(None, description="Minimum trip duration in days")
    max_days: Optional[int] = Field(None, description="Maximum trip duration in days")
    start_month: Optional[str] = Field(None, description="Start month for search")
    end_month: Optional[str] = Field(None, description="End month for search")
    max_price: Optional[float] = Field(None, description="Maximum price in Euros")
    non_stop: Optional[bool] = Field(False, description="Only non-stop flights")
    one_way: Optional[bool] = Field(False, description="One way only")


class TripOption(BaseModel):
    outbound_flight: FlightDetail = Field(..., description="Outbound flight")
    return_flight: Optional[FlightDetail] = Field(
        None, description="Return flight (None for one-way)"
    )
    total_price: float = Field(..., description="Total price for the trip")
    trip_duration_days: int = Field(..., description="Duration of the trip in days")


class FlightSearchResponse(BaseModel):
    trips: list[TripOption] = Field(..., description="List of trip options")
    count: int = Field(..., description="Number of trip options found")
