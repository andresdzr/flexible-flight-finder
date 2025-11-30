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
import { useTheme } from "next-themes";
import { DomEvent, type LatLngExpression } from "leaflet";
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
  getCityOpacity,
} from "@/lib/mapUtils";
import { useMap } from "@/contexts";
import "leaflet/dist/leaflet.css";

// Europe center coordinates
const EUROPE_CENTER: LatLngExpression = [50.0, 10.0];
const EUROPE_ZOOM = 4;

// Base sizes at default zoom
const BASE_MARKER_RADIUS = 8;

// Component to handle zoom events
function ZoomHandler({
  onZoomChange,
  onMapClick,
}: {
  onZoomChange: (zoom: number) => void;
  onMapClick: () => void;
}) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    click: () => {
      onMapClick();
    },
  });
  return null;
}

export function FlightMap() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { setSelectedRoute, selectedRoute } = useMap();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(EUROPE_ZOOM);

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
    console.log("City clicked:", cityName);
    setSelectedCity(cityName);
    setSelectedRoute(null);
  };

  const handleRouteClick = (route: FlightRoute) => {
    setSelectedRoute(route);
  };

  const handleMapClick = () => {
    if (!selectedRoute) {
      console.log("Map clicked, clearing selected city");
      setSelectedCity(null);
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
          key={isDark ? "dark" : "light"}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={
            isDark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
        />

        <ZoomHandler onZoomChange={setZoomLevel} onMapClick={handleMapClick} />

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
            priceRange.max,
            isDark
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
              }-${zoomLevel}-${opacity}-${isDark}`}
              positions={[originCoords, destCoords]}
              color={color}
              weight={weight}
              opacity={opacity}
              eventHandlers={{
                click: (e) => {
                  DomEvent.stopPropagation(e);
                  handleRouteClick(route);
                },
              }}
              pane="overlayPane"
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
        {citiesData?.cities.map((city: CityPricing) => {
          const opacity = selectedCity
            ? getCityOpacity(
                selectedCity === city.city.name ||
                  selectedRoute?.destination.name === city.city.name
              )
            : 0.8;
          return (
            <CircleMarker
              key={`${city.city.name}-${zoomLevel}-${opacity}`}
              center={[city.city.coords.lat, city.city.coords.lon]}
              radius={markerRadius}
              fillColor={getMarkerColor(city.price_range)}
              color={isDark ? "#fff" : "#888"}
              weight={2}
              opacity={1.0}
              fillOpacity={opacity}
              eventHandlers={{
                click: (e) => {
                  DomEvent.stopPropagation(e);
                  handleCityClick(city.city.name);
                },
              }}
              pane="markerPane"
            >
              <Tooltip>
                <div className="text-sm">
                  <strong>{city.city.name}</strong>
                  <div>Median: €{city.median_price}</div>
                  <div>Cheapest: €{city.min_price}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
