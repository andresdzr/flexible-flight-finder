import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import type { LatLngExpression } from "leaflet";
import { fetchCitiesPricing, fetchCityFlights } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { CityPricing, FlightRoute } from "@/types/api";
import {
  getMarkerColor,
  getPriceColor,
  getRouteThickness,
  getRoutePriceRange,
  getRouteFlightCountRange,
  getRouteOpacity,
} from "@/lib/mapUtils";
import "leaflet/dist/leaflet.css";

// Europe center coordinates
const EUROPE_CENTER: LatLngExpression = [50.0, 10.0];
const EUROPE_ZOOM = 4;

// Base sizes at default zoom
const BASE_MARKER_RADIUS = 8;

interface FlightMapProps {
  onRouteSelect: (origin: string, destination: string) => void;
}

// Component to handle zoom events
function ZoomHandler({
  onZoomChange,
}: {
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
}

export function FlightMap({ onRouteSelect }: FlightMapProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(EUROPE_ZOOM);
  const [selectedRoute, setSelectedRoute] = useState<FlightRoute | null>(null);

  const {
    data: citiesData,
    isLoading: citiesLoading,
    error: citiesError,
  } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCitiesPricing,
  });

  const {
    data: routesData,
    isLoading: routesLoading,
    error: routesError,
  } = useQuery({
    queryKey: ["city-flights", selectedCity],
    queryFn: () => fetchCityFlights(selectedCity!),
    enabled: !!selectedCity,
  });

  if (citiesError) {
    toast.error("Failed to load cities", {
      description:
        citiesError instanceof Error ? citiesError.message : "Unknown error",
    });
  }

  if (routesError) {
    toast.error("Failed to load routes", {
      description:
        routesError instanceof Error ? routesError.message : "Unknown error",
    });
  }

  const handleCityClick = (cityName: string) => {
    setSelectedCity(cityName);
    setSelectedRoute(null);
    onRouteSelect(cityName, "");
  };

  const handleRouteClick = (route: FlightRoute) => {
    setSelectedRoute(route);
    if (routesData?.origin_city) {
      onRouteSelect(routesData.origin_city.name, route.destination.name);
    }
  };

  const routes = routesData?.routes || [];
  const priceRange = getRoutePriceRange(routes);
  const flightCountRange = getRouteFlightCountRange(routes);

  const zoomScale = Math.pow(1.3, zoomLevel - EUROPE_ZOOM);
  const markerRadius = BASE_MARKER_RADIUS * zoomScale;

  if (citiesLoading) {
    return (
      <div className="w-full h-full flex flex-col gap-4 p-8">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={EUROPE_CENTER}
        zoom={EUROPE_ZOOM}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <ZoomHandler onZoomChange={setZoomLevel} />

        {/* Route Lines */}
        {routesLoading && selectedCity && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-1000 bg-white p-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <span className="text-sm">Loading routes...</span>
            </div>
          </div>
        )}

        {routes.map((route: FlightRoute) => {
          const originCoords: LatLngExpression = [
            routesData!.origin_city.coords.lat,
            routesData!.origin_city.coords.lon,
          ];
          const destCoords: LatLngExpression = [
            route.destination.coords.lat,
            route.destination.coords.lon,
          ];

          const color = getPriceColor(
            route.median_price,
            priceRange.min,
            priceRange.max
          );
          const baseWeight = getRouteThickness(
            route.flight_count,
            flightCountRange.min,
            flightCountRange.max
          );
          const opacity = selectedRoute
            ? getRouteOpacity(
                selectedRoute.destination.name === route.destination.name
              )
            : 0.7;
          const weight = baseWeight * Math.pow(zoomScale, 2);

          return (
            <Polyline
              key={`${routesData!.origin_city.name}-${
                route.destination.name
              }-${zoomLevel}-${opacity}`}
              positions={[originCoords, destCoords]}
              color={color}
              weight={weight}
              opacity={opacity}
              eventHandlers={{
                click: () => handleRouteClick(route),
              }}
            >
              <Tooltip>
                <div className="text-sm">
                  <strong>
                    {routesData!.origin_city.name} → {route.destination.name}
                  </strong>
                  <div>Avg: €{route.avg_price}</div>
                  <div>Min: €{route.min_price}</div>
                  <div>Flights: {route.flight_count}</div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* City Markers */}
        {citiesData?.cities.map((city: CityPricing) => (
          <CircleMarker
            key={`${city.city.name}-${zoomLevel}`}
            center={[city.city.coords.lat, city.city.coords.lon]}
            radius={markerRadius}
            fillColor={getMarkerColor(city.price_range)}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
            eventHandlers={{
              click: () => handleCityClick(city.city.name),
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <strong>{city.city.name}</strong>
                <div>Median: €{city.median_price}</div>
                <div>Cheapest: €{city.min_price}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
