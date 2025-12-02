from fastapi import APIRouter, Query
from app.schemas import FlightDetail, City, Coordinates
from app.search_schemas import FlightSearchResponse
import random
from typing import Optional

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/flights", response_model=FlightSearchResponse)
async def search_flights(
    min_days: Optional[int] = Query(None),
    max_days: Optional[int] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    non_stop: Optional[bool] = Query(False),
    one_way: Optional[bool] = Query(False),
):
    """
    Mock endpoint to search for flights.
    """
    
    # Mock data generation
    flights = []
    airlines = ["Lufthansa", "Ryanair", "Air France", "British Airways", "Iberia"]
    destinations = ["Paris", "London", "Berlin", "Rome", "Barcelona", "Amsterdam"]
    
    # Generate 10 mock flights
    for i in range(10):
        price = random.randint(50, int(max_price) if max_price else 500)
        airline = random.choice(airlines)
        destination_name = random.choice(destinations)
        
        # Mock cities
        origin = City(name="Madrid", coords=Coordinates(lat=40.4168, lon=-3.7038))
        destination = City(name=destination_name, coords=Coordinates(lat=0.0, lon=0.0)) # Mock coords
        
        # Mock dates
        day = random.randint(1, 28)
        month = random.randint(1, 12)
        year = 2024
        date = f"{year}-{month:02d}-{day:02d}"
        
        flight = FlightDetail(
            origin=origin,
            destination=destination,
            date=date,
            price=float(price),
            distance_km=random.randint(500, 2000),
            weekday=random.choice(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
            year=year,
            month=month,
            day=day
        )
        flights.append(flight)
        
    flights.sort(key=lambda x: x.price)
    
    return FlightSearchResponse(flights=flights, count=len(flights))
