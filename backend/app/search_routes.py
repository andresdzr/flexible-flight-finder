from fastapi import APIRouter, Query, HTTPException
from app.schemas import FlightDetail
from app.search_schemas import FlightSearchResponse, TripOption
from app.data_loader import get_data_loader
from typing import Optional
from datetime import datetime, timedelta
import polars as pl

router = APIRouter(prefix="/api/search", tags=["search"])

MONTH_MAP = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
}


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
    Search for flights with flexible parameters.
    For round trips, finds matching outbound/return flights respecting trip duration.
    """
    try:
        loader = get_data_loader()
        df = loader.df

        if df is None:
            raise HTTPException(status_code=500, detail="Data not loaded")

        # Filter by month range
        if start_month and end_month:
            start_month_num = MONTH_MAP.get(start_month)
            end_month_num = MONTH_MAP.get(end_month)
            if start_month_num and end_month_num:
                df = df.filter(
                    (pl.col("Month") >= start_month_num)
                    & (pl.col("Month") <= end_month_num)
                )

        # Filter by price
        if max_price:
            df = df.filter(pl.col("Price_in_EUR") <= max_price)

        if len(df) == 0:
            return FlightSearchResponse(trips=[], count=0)

        trips = []

        if one_way:
            # One-way flights: just return individual flights sorted by price
            df_sorted = df.sort("Price_in_EUR").head(50)

            for row in df_sorted.iter_rows(named=True):
                origin_city = loader.get_city(row["Origin"])
                dest_city = loader.get_city(row["Destination"])

                if not origin_city or not dest_city:
                    continue

                outbound = FlightDetail(
                    origin=origin_city,
                    destination=dest_city,
                    date=str(row["Date"]),
                    price=float(row["Price_in_EUR"]),
                    distance_km=int(row["Distance_km"]),
                    weekday=row["Weekday"],
                    year=int(row["Year"]),
                    month=int(row["Month"]),
                    day=int(row["Day"]),
                )

                trip = TripOption(
                    outbound_flight=outbound,
                    return_flight=None,
                    total_price=float(row["Price_in_EUR"]),
                    trip_duration_days=0,
                )
                trips.append(trip)
        else:
            # Round-trip flights: pair outbound and return flights
            min_days = min_days or 3
            max_days = max_days or 14

            # Get outbound flights (sorted by price for efficiency)
            outbound_df = df.sort("Price_in_EUR").head(200)

            for outbound_row in outbound_df.iter_rows(named=True):
                origin = outbound_row["Origin"]
                destination = outbound_row["Destination"]
                outbound_date = outbound_row["Date"]
                outbound_price = float(outbound_row["Price_in_EUR"])

                # Calculate return date range
                outbound_date_obj = datetime.strptime(str(outbound_date), "%Y-%m-%d")
                min_return_date = outbound_date_obj + timedelta(days=min_days)
                max_return_date = outbound_date_obj + timedelta(days=max_days)

                # Find return flights (reverse route)
                return_flights = (
                    df.filter(
                        (pl.col("Origin") == destination)
                        & (pl.col("Destination") == origin)
                        & (pl.col("Date") >= min_return_date)
                        & (pl.col("Date") <= max_return_date)
                    )
                    .sort("Price_in_EUR")
                    .head(3)
                )  # Top 3 cheapest return flights per outbound

                for return_row in return_flights.iter_rows(named=True):
                    return_price = float(return_row["Price_in_EUR"])
                    total_price = outbound_price + return_price

                    # Check max price constraint for total
                    if max_price and total_price > max_price:
                        continue

                    origin_city = loader.get_city(origin)
                    dest_city = loader.get_city(destination)

                    if not origin_city or not dest_city:
                        continue

                    outbound = FlightDetail(
                        origin=origin_city,
                        destination=dest_city,
                        date=str(outbound_date),
                        price=outbound_price,
                        distance_km=int(outbound_row["Distance_km"]),
                        weekday=outbound_row["Weekday"],
                        year=int(outbound_row["Year"]),
                        month=int(outbound_row["Month"]),
                        day=int(outbound_row["Day"]),
                    )

                    return_flight = FlightDetail(
                        origin=dest_city,
                        destination=origin_city,
                        date=str(return_row["Date"]),
                        price=return_price,
                        distance_km=int(return_row["Distance_km"]),
                        weekday=return_row["Weekday"],
                        year=int(return_row["Year"]),
                        month=int(return_row["Month"]),
                        day=int(return_row["Day"]),
                    )

                    # Calculate actual trip duration
                    return_date_obj = datetime.strptime(
                        str(return_row["Date"]), "%Y-%m-%d"
                    )
                    duration = (return_date_obj - outbound_date_obj).days

                    trip = TripOption(
                        outbound_flight=outbound,
                        return_flight=return_flight,
                        total_price=total_price,
                        trip_duration_days=duration,
                    )
                    trips.append(trip)

            # Sort by total price
            trips.sort(key=lambda x: x.total_price)
            # Limit results
            trips = trips[:50]

        return FlightSearchResponse(trips=trips, count=len(trips))

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error searching flights: {str(e)}"
        )
