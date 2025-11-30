export interface Coordinates {
  lat: number;
  lon: number;
}

export interface City {
  name: string;
  coords: Coordinates;
}

export interface CityPricing {
  city: City;
  average_price: number;
  median_price: number;
  min_price: number;
  price_range: "budget" | "moderate" | "expensive" | "premium";
  flight_count: number;
}

export interface CityPricingResponse {
  cities: CityPricing[];
  total_cities: number;
}

export interface FlightRoute {
  destination: City;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  flight_count: number;
}

export interface FlightDetail {
  origin: City;
  destination: City;
  date: string;
  price: number;
  distance_km: number;
  weekday: string;
  year: number;
  month: number;
  day: number;
}

export interface CityFlightsResponse {
  origin_city: City;
  routes: FlightRoute[];
  cheapest_flights: FlightDetail[];
  total_routes: number;
}

export interface RouteFlights {
  origin: City;
  destination: City;
  cheapest_flights: FlightDetail[];
  flight_count: number;
}

export interface CheapestFlightsPerRouteResponse {
  routes: RouteFlights[];
  total_routes: number;
}
