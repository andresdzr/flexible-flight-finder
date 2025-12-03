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

class FlightSearchResponse(BaseModel):
    flights: list[FlightDetail] = Field(..., description="List of found flights")
    count: int = Field(..., description="Number of flights found")
