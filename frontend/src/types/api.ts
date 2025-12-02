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
  origin: City;
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

export interface CalendarDayPrice {
  date: string;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  flight_count: number;
}

export interface CheapestRoute {
  origin: City;
  destination: City;
  median_price: number;
  min_price: number;
  avg_price: number;
  max_price: number;
  flight_count: number;
  distance_km: number;
}

export interface WeekdayStats {
  weekday: string;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  flight_count: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  month_name: string;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  flight_count: number;
}

export interface PriceDistribution {
  bucket: string;
  count: number;
  percentage: number;
}

export interface StatisticsMetadata {
  total_flights: number;
  total_routes: number;
  date_range_start: string;
  date_range_end: string;
  computed_at: string;
  cache_hit: boolean;
}

export interface StatisticsResponse {
  calendar_data: CalendarDayPrice[];
  cheapest_routes: CheapestRoute[];
  weekday_stats: WeekdayStats[];
  monthly_stats: MonthlyStats[];
  price_distribution: PriceDistribution[];
  metadata: StatisticsMetadata;
}

export interface FlightSearchParams {
  min_days?: number;
  max_days?: number;
  start_month?: string;
  end_month?: string;
  max_price?: number;
  non_stop?: boolean;
  one_way?: boolean;
}

export interface TripOption {
  outbound_flight: FlightDetail;
  return_flight?: FlightDetail;
  total_price: number;
  trip_duration_days: number;
}

export interface FlightSearchResponse {
  trips: TripOption[];
  count: number;
}
