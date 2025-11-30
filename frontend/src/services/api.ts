import axios from "axios";
import type {
  CityPricingResponse,
  CityFlightsResponse,
  CheapestFlightsPerRouteResponse,
} from "@/types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const fetchCitiesPricing = async (): Promise<CityPricingResponse> => {
  const { data } = await api.get<CityPricingResponse>("/api/cities/pricing");
  return data;
};

export const fetchCityFlights = async (
  cityName: string
): Promise<CityFlightsResponse> => {
  const { data } = await api.get<CityFlightsResponse>(
    `/api/cities/${encodeURIComponent(cityName)}/flights`
  );
  return data;
};

export const fetchCheapestFlightsPerRoute = async (
  origin: string,
  destination: string
): Promise<CheapestFlightsPerRouteResponse> => {
  const { data } = await api.get<CheapestFlightsPerRouteResponse>(
    "/api/cities/routes/cheapest",
    {
      params: { origin, destination },
    }
  );
  return data;
};
