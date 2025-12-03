from fastapi import APIRouter, Query
from app.schemas import FlightDetail, City, Coordinates
from app.search_schemas import (
    FlightSearchResponse,
    MulticitySearchResponse,
    MulticityTrip,
    MulticityLeg,
)
from app.price_predictor_service import price_predictor
import random
from typing import Optional
from datetime import date
import os

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/flights", response_model=FlightSearchResponse)
async def search_flights(
    origin: Optional[str] = Query(None),
    min_days: Optional[int] = Query(None),
    max_days: Optional[int] = Query(None),
    start_month: Optional[str] = Query(None),
    end_month: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    non_stop: Optional[bool] = Query(False),
    one_way: Optional[bool] = Query(False),
):
    """
    Search for flights using Amadeus API with fallback to mock data.
    """
    from app.amadeus_client import amadeus_client
    from app.airport_service import airport_service
    from datetime import datetime, timedelta
    import calendar

    # Helper to convert month name to date range
    def get_date_range(start_month_name, end_month_name):
        try:
            month_map = {name: i for i, name in enumerate(calendar.month_name) if name}
            start_month_idx = month_map.get(start_month_name.capitalize())
            end_month_idx = month_map.get(end_month_name.capitalize())

            if not start_month_idx or not end_month_idx:
                return None

            current_year = datetime.now().year
            # If start month is earlier than current month, assume next year
            # For simplicity, let's just use current year + 1 if month < current month, else current year
            # But user said "2025-12-10,2025-12-30" in example.
            # Let's try to construct a valid range.

            # Simple logic: Start from 1st of start_month to end of end_month
            # Year logic: if month is in past relative to now, use next year.

            now = datetime.now()
            start_year = now.year
            if start_month_idx < now.month:
                start_year += 1

            end_year = start_year
            if end_month_idx < start_month_idx:
                end_year += 1

            start_date_str = f"{start_year}-{start_month_idx:02d}-01"

            # Get last day of end month
            last_day = calendar.monthrange(end_year, end_month_idx)[1]
            end_date_str = f"{end_year}-{end_month_idx:02d}-{last_day:02d}"

            return f"{start_date_str},{end_date_str}"
        except Exception:
            return None

    # Try Amadeus API first
    amadeus_results = []  # Initialize amadeus_results here

    date_range = None
    if start_date and end_date:
        date_range = f"{start_date},{end_date}"
    elif start_month and end_month:
        date_range = get_date_range(start_month, end_month)

    if date_range:
        # Duration is only valid for round trips in Amadeus Flight Inspiration Search
        duration = (
            f"{min_days},{max_days}"
            if (min_days and max_days and not one_way)
            else None
        )

        search_origins = (
            [origin] if origin else ["MAD"]
        )  # Default to MAD for API call if not provided

        # If origin is likely a city name (longer than 3 chars), try to resolve it
        if origin and len(origin) > 3:
            resolved_origins = airport_service.get_iata_codes_by_city(origin)
            if resolved_origins:
                search_origins = resolved_origins

        # Search for each origin airport
        for search_origin in search_origins:
            try:
                amadeus_response = await amadeus_client.search_flight_destinations(
                    origin=search_origin,
                    departure_date_range=date_range,
                    one_way=one_way,
                    duration=duration,
                    non_stop=non_stop,
                    max_price=max_price,
                )

                if amadeus_response and "data" in amadeus_response:
                    for item in amadeus_response["data"]:
                        try:
                            dept_date_str = item.get("departureDate")
                            return_date_str = item.get("returnDate")
                            price_total = float(item.get("price", {}).get("total", 0))
                            dest_code = item.get("destination")
                            origin_code = item.get("origin")

                            # Get city names from airport_service
                            origin_name = airport_service.get_city_name(origin_code)
                            dest_name = airport_service.get_city_name(dest_code)

                            # Calculate distance
                            distance = airport_service.calculate_distance(
                                origin_code, dest_code
                            )

                            # Get country codes
                            origin_country = airport_service.get_country_code(
                                origin_code
                            )
                            dest_country = airport_service.get_country_code(dest_code)

                            origin_obj = City(
                                name=origin_name,
                                country_code=origin_country,
                                coords=Coordinates(lat=0.0, lon=0.0),
                            )
                            dest_obj = City(
                                name=dest_name,
                                country_code=dest_country,
                                coords=Coordinates(lat=0.0, lon=0.0),
                            )

                            if max_price and price_total > max_price:
                                continue

                            days_until = (
                                datetime.strptime(dept_date_str, "%Y-%m-%d")
                                - datetime.now()
                            ).days
                            days_until = max(0, days_until)

                            flight_data_for_pred = {
                                "origin": origin_code,
                                "destination": dest_code,
                                "date": dept_date_str,
                                "distance_km": distance,
                                "weekday": datetime.strptime(
                                    dept_date_str, "%Y-%m-%d"
                                ).strftime("%A"),
                                "year": int(dept_date_str.split("-")[0]),
                                "month": int(dept_date_str.split("-")[1]),
                                "day": int(dept_date_str.split("-")[2]),
                                "days_until_departure": days_until,
                                "origin_lat": origin_obj.coords.lat,
                                "origin_lon": origin_obj.coords.lon,
                                "dest_lat": dest_obj.coords.lat,
                                "dest_lon": dest_obj.coords.lon,
                                "return_date": return_date_str
                            }

                            # predicted_price = price_predictor.predict_price(flight_data_for_pred)
                            # is_superdeal, savings = price_predictor.check_superdeal(price_total, predicted_price)
                            
                            trend = price_predictor.predict_trend(flight_data_for_pred, price_total)

                            flight = FlightDetail(
                                origin=origin_obj,
                                destination=dest_obj,
                                date=dept_date_str,
                                return_date=(
                                    return_date_str if return_date_str else None
                                ),
                                price=price_total,
                                distance_km=distance,
                                weekday=datetime.strptime(
                                    dept_date_str, "%Y-%m-%d"
                                ).strftime("%A"),
                                year=int(dept_date_str.split("-")[0]),
                                month=int(dept_date_str.split("-")[1]),
                                day=int(dept_date_str.split("-")[2]),
                                price_trend=trend
                            )

                            flight_dict = flight.model_dump()
                            flight_dict["airline"] = "Amadeus Found"  # Placeholder
                            flight_dict["duration"] = "N/A"
                            flight_dict["stops"] = "Non-stop" if non_stop else "Unknown"
                            flight_dict["departure"] = "10:00"  # Mock
                            flight_dict["arrival"] = "12:00"  # Mock

                            amadeus_results.append(flight_dict)
                        except Exception as e:
                            print(f"Error parsing amadeus item: {e}")
                            continue
            except Exception as e:
                print(f"Error searching for origin {search_origin}: {e}")
                continue

    # Sort by price
    amadeus_results.sort(key=lambda x: x["price"])
    return FlightSearchResponse(flights=amadeus_results, count=len(amadeus_results))


@router.get("/flights/multicity", response_model=MulticitySearchResponse)
async def search_multicity_flights(
    origin: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    city_type_key: Optional[str] = Query(None),
):
    """
    Search for optimal multicity trip using the optimizer.
    """
    from app.optimizer import optimizer
    from app.airport_service import airport_service

    if not origin or not start_date or not end_date or not max_price:
        return MulticitySearchResponse(
            trip=None,
            status="error",
            message="Missing required parameters: origin, start_date, end_date, max_price",
        )

    try:
        # Parse dates
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)

        # Resolve origin city if it's an IATA code
        origin_name = origin
        if len(origin) == 3:
            resolved_name = airport_service.get_city_name(origin)
            if resolved_name:
                origin_name = resolved_name

        # Find CSV path - try multiple locations
        possible_paths = [
            os.path.join(os.getcwd(), "data", "vuelos_kayak_clean_final.csv"),
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "model",
                "Optimization Model" "vuelos_kayak_clean_final.csv",
            ),
        ]

        csv_path = None
        for path in possible_paths:
            if os.path.isfile(path):
                csv_path = path
                break

        if not csv_path:
            return MulticitySearchResponse(
                trip=None, status="error", message="Flight data CSV not found"
            )

        # Call optimizer
        result = optimizer(
            start_date=start,
            end_date=end,
            budget=max_price,
            origin=origin_name,
            csv_path=csv_path,
            city_type_key=city_type_key,
            verbose=False,
            min_days_per_city=1,
        )

        # Check if optimization was successful
        if result["termination"] not in ("optimal", "feasible"):
            return MulticitySearchResponse(
                trip=None,
                status="no_solution",
                message=f"No optimal trip found within budget. Status: {result['status']}",
            )

        # Extract the trip details
        visited_cities = result.get("visited_cities", [])
        flights = result.get("flights", [])
        total_cost = result.get("total_cost", 0.0)
        cost_by_flight = result.get("total_cost_by_flight", {})

        # Build legs
        legs = []
        for orig, dest in flights:
            leg_cost = cost_by_flight.get((orig, dest), 0.0)
            legs.append(MulticityLeg(origin=orig, destination=dest, price=leg_cost))

        trip = MulticityTrip(
            origin=origin_name,
            visited_cities=visited_cities,
            legs=legs,
            total_cost=total_cost,
            total_cities=len(visited_cities),
        )

        return MulticitySearchResponse(
            trip=trip,
            status="success",
            message=f"Found optimal trip visiting {len(visited_cities)} cities",
        )

    except FileNotFoundError as e:
        return MulticitySearchResponse(
            trip=None, status="error", message=f"Data file not found: {str(e)}"
        )
    except ValueError as e:
        return MulticitySearchResponse(
            trip=None, status="error", message=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        return MulticitySearchResponse(
            trip=None, status="error", message=f"Error optimizing trip: {str(e)}"
        )
