from fastapi import APIRouter, HTTPException
import polars as pl
from app.data_loader import get_data_loader
from app.schemas import (
    CityPricing,
    CityPricingResponse,
    CityFlightsResponse,
    FlightRoute,
    FlightDetail,
    RouteFlights,
    CheapestFlightsPerRouteResponse,
)

router = APIRouter(prefix="/api/cities", tags=["cities"])


@router.get("/pricing", response_model=CityPricingResponse)
async def get_cities_pricing():
    """
    Get average pricing for all destination cities.
    Returns cities with average prices, price ranges, and color categories for map visualization.
    Excludes high outliers (top 10%) but keeps low outliers.
    """
    try:
        loader = get_data_loader()
        df = loader.df

        if df is None:
            raise HTTPException(status_code=500, detail="Data not loaded")

        # Group by destination city
        destinations = df["Destination"].unique().to_list()

        # First pass: collect all average prices for relative categorization
        city_data = []
        for dest_city in destinations:
            flights_to_city = df.filter(pl.col("Destination") == dest_city)
            prices = flights_to_city["Price in €"].to_list()

            if not prices:
                continue

            # Calculate statistics excluding high outliers
            avg_price, median_price, min_price, max_price = (
                loader.calculate_price_statistics(prices, exclude_high_outliers=True)
            )

            city = loader.get_city(dest_city)
            if not city:
                continue

            city_data.append(
                {
                    "city": city,
                    "avg_price": avg_price,
                    "median_price": median_price,
                    "min_price": min_price,
                    "flight_count": len(prices),
                }
            )

        # Extract all average prices for categorization
        all_avg_prices = [d["avg_price"] for d in city_data]

        # Second pass: categorize and build response
        city_pricing_list = []
        for data in city_data:
            price_range = loader.categorize_price_relative(
                data["avg_price"], all_avg_prices
            )

            city_pricing = CityPricing(
                city=data["city"],
                average_price=round(data["avg_price"], 2),
                median_price=round(data["median_price"], 2),
                min_price=round(data["min_price"], 2),
                price_range=price_range,
                flight_count=data["flight_count"],
            )
            city_pricing_list.append(city_pricing)

        # Sort by average price
        city_pricing_list.sort(key=lambda x: x.average_price)

        return CityPricingResponse(
            cities=city_pricing_list, total_cities=len(city_pricing_list)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")


@router.get("/{city_name}/flights", response_model=CityFlightsResponse)
async def get_city_flights(city_name: str):
    """
    Get all flights FROM a specific city.
    Returns:
    - Price ranges to each destination (average, min, max excluding high outliers)
    - Top 5 cheapest individual flights with complete details
    """
    try:
        loader = get_data_loader()
        df = loader.df

        if df is None:
            raise HTTPException(status_code=500, detail="Data not loaded")

        # Get origin city info
        origin_city = loader.get_city(city_name)
        if not origin_city:
            raise HTTPException(
                status_code=404, detail=f"City '{city_name}' not found or not geocoded"
            )

        # Filter flights from this city
        flights_from_city = df.filter(pl.col("Origin") == city_name)

        if len(flights_from_city) == 0:
            raise HTTPException(
                status_code=404, detail=f"No flights found from '{city_name}'"
            )

        # Group by destination and calculate price ranges
        destinations = flights_from_city["Destination"].unique().to_list()
        routes = []

        for dest_city_name in destinations:
            flights_to_dest = flights_from_city.filter(
                pl.col("Destination") == dest_city_name
            )
            prices = flights_to_dest["Price in €"].to_list()

            if not prices:
                continue

            # Calculate statistics excluding high outliers
            avg_price, median_price, min_price, max_price = (
                loader.calculate_price_statistics(prices, exclude_high_outliers=True)
            )

            dest_city = loader.get_city(dest_city_name)
            if not dest_city:
                continue

            route = FlightRoute(
                origin=origin_city,
                destination=dest_city,
                avg_price=round(avg_price, 2),
                median_price=round(median_price, 2),
                min_price=round(min_price, 2),
                max_price=round(max_price, 2),
                flight_count=len(prices),
            )
            routes.append(route)

        # Sort routes by average price
        routes.sort(key=lambda x: x.avg_price)

        # Get top 5 cheapest individual flights
        cheapest_flights_df = flights_from_city.sort("Price in €").head(5)

        cheapest_flights = []
        for row in cheapest_flights_df.iter_rows(named=True):
            dest_city = loader.get_city(row["Destination"])
            if not dest_city:
                continue

            flight = FlightDetail(
                origin=origin_city,
                destination=dest_city,
                date=str(row["Date"]),
                price=float(row["Price in €"]),
                distance_km=int(row["Distance_km"]),
                weekday=row["Weekday"],
                year=int(row["Year"]),
                month=int(row["Month"]),
                day=int(row["Day"]),
            )
            cheapest_flights.append(flight)

        return CityFlightsResponse(
            origin_city=origin_city,
            routes=routes,
            cheapest_flights=cheapest_flights,
            total_routes=len(routes),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")


@router.get("/routes/cheapest", response_model=CheapestFlightsPerRouteResponse)
async def get_cheapest_flights_per_route(origin: str, destination: str):
    """
    Get the top 10 cheapest flights for a specific flight route.
    Args:
        origin: Origin city name
        destination: Destination city name
    Returns the 10 cheapest flights for the specified route.
    """
    try:
        loader = get_data_loader()
        df = loader.df

        if df is None:
            raise HTTPException(status_code=500, detail="Data not loaded")

        # Get city info
        origin_city = loader.get_city(origin)
        dest_city = loader.get_city(destination)

        if not origin_city:
            raise HTTPException(
                status_code=404,
                detail=f"Origin city '{origin}' not found or not geocoded",
            )

        if not dest_city:
            raise HTTPException(
                status_code=404,
                detail=f"Destination city '{destination}' not found or not geocoded",
            )

        # Filter flights for this specific route
        route_flights = df.filter(
            (pl.col("Origin") == origin) & (pl.col("Destination") == destination)
        )

        if len(route_flights) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No flights found from '{origin}' to '{destination}'",
            )

        total_flights = len(route_flights)

        # Get top 10 cheapest flights
        cheapest_flights_df = route_flights.sort("Price in €").head(10)

        cheapest_flights = []
        for row in cheapest_flights_df.iter_rows(named=True):
            flight = FlightDetail(
                origin=origin_city,
                destination=dest_city,
                date=str(row["Date"]),
                price=float(row["Price in €"]),
                distance_km=int(row["Distance_km"]),
                weekday=row["Weekday"],
                year=int(row["Year"]),
                month=int(row["Month"]),
                day=int(row["Day"]),
            )
            cheapest_flights.append(flight)

        route_data = RouteFlights(
            origin=origin_city,
            destination=dest_city,
            cheapest_flights=cheapest_flights,
            flight_count=total_flights,
        )

        return CheapestFlightsPerRouteResponse(routes=[route_data], total_routes=1)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")
