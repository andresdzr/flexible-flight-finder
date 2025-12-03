import { useState, useRef, useEffect } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { fetchCitiesPricing, fetchCityFlights } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { CityPricing, FlightRoute } from "@/types/api";
import {
  getPriceColor,
  getRoutePriceRange,
  getRouteOpacity,
  getCityOpacity,
  getHexMarkerColor,
} from "@/lib/mapUtils";
import { useMap } from "@/contexts";

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  city: CityPricing;
  opacity: number;
}

interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  route: FlightRoute;
  opacity: number;
  strokeWidth: number;
}

export function FlightGlobe() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { setSelectedRoute, selectedRoute } = useMap();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const globeEl = useRef<GlobeMethods>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Center on Europe on mount
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView(
        {
          lat: 50.0,
          lng: 10.0,
          altitude: 2.5,
        },
        1000
      );
    }
  }, []);

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

  const handleCityClick = (point: object) => {
    const p = point as GlobePoint;
    console.log("City clicked:", p.city.city.name);
    setSelectedCity(p.city.city.name);
    setSelectedRoute(null);

    // Animate camera to the clicked city
    if (globeEl.current) {
      globeEl.current.pointOfView(
        {
          lat: p.lat,
          lng: p.lng,
          altitude: 0.5,
        },
        1000
      );
    }
  };

  const handleArcClick = (arc: object) => {
    const a = arc as GlobeArc;
    setSelectedRoute(a.route);
  };

  const handleGlobeClick = () => {
    if (!selectedRoute) {
      console.log("Globe clicked, clearing selected city");
      setSelectedCity(null);
    }
  };

  const routes = routesData?.routes || [];
  const priceRange = getRoutePriceRange(routes);

  // Transform cities data for Globe
  const pointsData: GlobePoint[] =
    citiesData?.cities.map((city: CityPricing) => {
      const opacity = selectedCity
        ? getCityOpacity(
            selectedCity === city.city.name ||
              selectedRoute?.destination.name === city.city.name
          )
        : 0.8;

      return {
        lat: city.city.coords.lat,
        lng: city.city.coords.lon,
        size: 0.5,
        color: getHexMarkerColor(city.price_range),
        city,
        opacity,
      };
    }) || [];

  console.log(
    "Cities data:",
    citiesData?.cities.length,
    "Point data:",
    pointsData.length
  );

  // Transform routes data for Globe
  const arcsData: GlobeArc[] = routes.map((route: FlightRoute) => {
    const opacity = selectedRoute
      ? getRouteOpacity(
          selectedRoute.destination.name === route.destination.name
        )
      : 0.7;

    const color = getPriceColor(
      route.median_price,
      priceRange.min,
      priceRange.max,
      isDark,
      opacity
    );

    return {
      startLat: routesData!.origin_city.coords.lat,
      startLng: routesData!.origin_city.coords.lon,
      endLat: route.destination.coords.lat,
      endLng: route.destination.coords.lon,
      color,
      route,
      opacity,
      strokeWidth: 0.5,
    };
  });

  if (citiesLoading) {
    return (
      <div className="w-full h-full flex flex-col gap-4 p-8">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {routesLoading && selectedCity && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-1000 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <span className="text-sm">Loading routes...</span>
          </div>
        </div>
      )}

      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={isDark ? "#0a0a0a" : "#ffffff"}
        globeImageUrl={
          isDark
            ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
            : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        }
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl={"//unpkg.com/three-globe/example/img/night-sky.png"}
        // Points (Cities)
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={(point: object) => {
          const p = point as GlobePoint;
          const baseColor = p.color;
          return `${baseColor}${Math.round(p.opacity * 255)
            .toString(16)
            .padStart(2, "0")}`;
        }}
        pointAltitude={0.01}
        pointRadius={(point: object) => (point as GlobePoint).size}
        pointLabel={(point: object) => {
          const p = point as GlobePoint;
          return `
            <div style="
              background: ${
                isDark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)"
              };
              color: ${isDark ? "white" : "black"};
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
              <strong>${p.city.city.name}</strong><br/>
              Median: €${p.city.median_price}<br/>
              Cheapest: €${p.city.min_price}
            </div>
          `;
        }}
        onPointClick={handleCityClick}
        // Arcs (Routes)
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(arc: object) => {
          const a = arc as GlobeArc;
          return [a.color, a.color];
        }}
        arcStroke={(arc: object) => {
          const a = arc as GlobeArc;
          return a.strokeWidth;
        }}
        arcAltitude={0.05}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={3000}
        arcLabel={(arc: object) => {
          const a = arc as GlobeArc;
          return `
            <div style="
              background: ${
                isDark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)"
              };
              color: ${isDark ? "white" : "black"};
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
              <strong>${a.route.origin.name} → ${
            a.route.destination.name
          }</strong><br/>
              Avg: €${a.route.avg_price}<br/>
              Min: €${a.route.min_price}<br/>
              Flights: ${a.route.flight_count}
            </div>
          `;
        }}
        onArcClick={handleArcClick}
        // Interaction
        onGlobeClick={handleGlobeClick}
        // Atmosphere
        atmosphereColor={isDark ? "#3a74d0" : "#87ceeb"}
        atmosphereAltitude={0.15}
        // Camera controls
        enablePointerInteraction={true}
      />
    </div>
  );
}
