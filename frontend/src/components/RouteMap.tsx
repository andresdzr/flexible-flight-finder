import {
  MapContainer,
  TileLayer,
  Polyline,
  Tooltip,
  useMap,
  Marker,
} from "react-leaflet";
import { useTheme } from "next-themes";
import {
  type LatLngExpression,
  type LatLngBounds,
  latLngBounds,
  divIcon,
} from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

export interface RoutePoint {
  name: string;
  coords: {
    lat: number;
    lon: number;
  };
  order: number;
}

export interface RouteSegment {
  from: RoutePoint;
  to: RoutePoint;
  price: number;
  distance?: number;
}

interface RouteMapProps {
  routes: RouteSegment[];
  className?: string;
}

// Component to fit bounds when routes change
function BoundsHandler({ routes }: { routes: RouteSegment[] }) {
  const map = useMap();

  useEffect(() => {
    if (routes.length === 0) return;

    // Collect all unique points
    const points: LatLngExpression[] = [];
    const addedPoints = new Set<string>();

    routes.forEach((route) => {
      const fromKey = `${route.from.coords.lat},${route.from.coords.lon}`;
      const toKey = `${route.to.coords.lat},${route.to.coords.lon}`;

      if (!addedPoints.has(fromKey)) {
        points.push([route.from.coords.lat, route.from.coords.lon]);
        addedPoints.add(fromKey);
      }
      if (!addedPoints.has(toKey)) {
        points.push([route.to.coords.lat, route.to.coords.lon]);
        addedPoints.add(toKey);
      }
    });

    if (points.length > 0) {
      const bounds: LatLngBounds = latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  }, [routes, map]);

  return null;
}

export function RouteMap({ routes, className = "" }: RouteMapProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Default center (will be adjusted by BoundsHandler)
  const DEFAULT_CENTER: LatLngExpression = [50.0, 10.0];
  const DEFAULT_ZOOM = 4;

  return (
    <div className={`w-full h-full relative ${className}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full rounded-lg"
        zoomControl={true}
        scrollWheelZoom={true}
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

        <BoundsHandler routes={routes} />

        {routes.map((route, index) => {
          const fromCoords: LatLngExpression = [
            route.from.coords.lat,
            route.from.coords.lon,
          ];
          const toCoords: LatLngExpression = [
            route.to.coords.lat,
            route.to.coords.lon,
          ];

          // Color gradient from purple to blue
          const hue = 180 + (index / routes.length) * 60;
          const color = `hsl(${hue}, 70%, ${isDark ? "60%" : "50%"})`;

          return (
            <div key={index}>
              <Polyline
                positions={[fromCoords, toCoords]}
                color={color}
                weight={4}
                opacity={0.8}
                pane="overlayPane"
              >
                <Tooltip>
                  <div className="text-sm font-medium">
                    <div className="font-bold mb-1">
                      Leg {index + 1}: {route.from.name} → {route.to.name}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div>Price: €{Math.round(route.price)}</div>
                      {route.distance && (
                        <div>Distance: {Math.round(route.distance)} km</div>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </div>
          );
        })}

        {/* City Markers with numbers */}
        {routes.map((route, index) => {
          // Add markers for both from and to, but avoid duplicates
          const markers = [];

          if (index === 0) {
            // First route: add the origin marker
            markers.push({
              point: route.from,
              key: `marker-from-${index}`,
            });
          }

          // Always add the destination marker
          if (index !== routes.length - 1) {
            markers.push({
              point: route.to,
              key: `marker-to-${index}`,
            });
          }

          return markers.map(({ point, key }) => (
            <Marker
              key={key}
              position={[point.coords.lat, point.coords.lon]}
              icon={divIcon({
                className: "city-marker",
                html: `
                  <div style="
                    width: 36px;
                    height: 36px;
                    background-color: ${isDark ? "#8b5cf6" : "#7c3aed"};
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  ">
                    <span style="
                      color: white;
                      font-weight: bold;
                      font-size: 16px;
                      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                    ">${point.order}</span>
                  </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              })}
            >
              <Tooltip direction="top" offset={[0, -20]}>
                <div className="text-sm font-semibold">{point.name}</div>
              </Tooltip>
            </Marker>
          ));
        })}
      </MapContainer>

      <style>{`
        .city-marker {
          background: transparent !important;
          border: none !important;
        }
        .arrow-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
