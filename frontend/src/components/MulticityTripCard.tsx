import { Card } from "@/components/ui/card";
import { RouteMap, type RouteSegment } from "@/components/RouteMap";
import { Plane, TrendingUp } from "lucide-react";
import type { MulticityTrip } from "@/types/api";

interface MulticityTripCardProps {
  trip: MulticityTrip;
}

export function MulticityTripCard({ trip }: MulticityTripCardProps) {
  // Convert trip legs to route segments for the map
  const routeSegments: RouteSegment[] = trip.legs.map((leg, index) => ({
    from: {
      name: leg.origin,
      coords: { lat: 0, lon: 0 }, // Will be populated from geocoding
      order: index + 1,
    },
    to: {
      name: leg.destination,
      coords: { lat: 0, lon: 0 }, // Will be populated from geocoding
      order: index + 2,
    },
    price: leg.price,
  }));

  // Geocode city names to coordinates
  // This is a simplified version - in production you'd fetch these from your backend
  const cityCoordinates: Record<string, { lat: number; lon: number }> = {
    // Major European cities coordinates
    Madrid: { lat: 40.4168, lon: -3.7038 },
    Barcelona: { lat: 41.3874, lon: 2.1686 },
    Paris: { lat: 48.8566, lon: 2.3522 },
    London: { lat: 51.5074, lon: -0.1278 },
    Rome: { lat: 41.9028, lon: 12.4964 },
    Berlin: { lat: 52.52, lon: 13.405 },
    Amsterdam: { lat: 52.3676, lon: 4.9041 },
    Vienna: { lat: 48.2082, lon: 16.3738 },
    Prague: { lat: 50.0755, lon: 14.4378 },
    Budapest: { lat: 47.4979, lon: 19.0402 },
    Lisbon: { lat: 38.7223, lon: -9.1393 },
    Athens: { lat: 37.9838, lon: 23.7275 },
    Dublin: { lat: 53.3498, lon: -6.2603 },
    Brussels: { lat: 50.8503, lon: 4.3517 },
    Copenhagen: { lat: 55.6761, lon: 12.5683 },
    Stockholm: { lat: 59.3293, lon: 18.0686 },
    Oslo: { lat: 59.9139, lon: 10.7522 },
    Helsinki: { lat: 60.1695, lon: 24.9354 },
    Warsaw: { lat: 52.2297, lon: 21.0122 },
    Munich: { lat: 48.1351, lon: 11.582 },
    Milan: { lat: 45.4642, lon: 9.19 },
    Venice: { lat: 45.4408, lon: 12.3155 },
    Florence: { lat: 43.7696, lon: 11.2558 },
    Nice: { lat: 43.7102, lon: 7.262 },
    Lyon: { lat: 45.764, lon: 4.8357 },
    Zurich: { lat: 47.3769, lon: 8.5417 },
    Geneva: { lat: 46.2044, lon: 6.1432 },
    Edinburgh: { lat: 55.9533, lon: -3.1883 },
    Manchester: { lat: 53.4808, lon: -2.2426 },
    Porto: { lat: 41.1579, lon: -8.6291 },
  };

  // Update route segments with coordinates
  routeSegments.forEach((segment) => {
    const fromCoords = cityCoordinates[segment.from.name];
    const toCoords = cityCoordinates[segment.to.name];
    if (fromCoords) {
      segment.from.coords = fromCoords;
    }
    if (toCoords) {
      segment.to.coords = toCoords;
    }
  });

  return (
    <div className="space-y-6">
      {/* Trip Summary Card */}
      <Card className="p-6 bg-background border-purple-200 dark:border-purple-800">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Optimized Multi-City Trip
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {trip.total_cities} cities • {trip.legs.length} flights
                </p>
              </div>
            </div>

            {/* Cities Route */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {trip.visited_cities.map((city, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg font-semibold text-gray-900 dark:text-white border border-purple-200 dark:border-purple-700">
                    {city}
                  </span>
                  {index < trip.visited_cities.length - 1 && (
                    <Plane className="w-4 h-4 text-purple-500 rotate-90" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total Price */}
          <div className="text-right">
            <div className="text-5xl font-bold text-purple-600 dark:text-purple-400">
              €{Math.round(trip.total_cost)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Total trip cost</div>
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Best Route</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card className="p-4 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Route Map
        </h3>
        <div className="h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <RouteMap routes={routeSegments} />
        </div>
      </Card>

      {/* Flight Legs */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Flight Itinerary
        </h3>
        {trip.legs.map((leg, index) => (
          <Card
            key={index}
            className="p-5 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1">
                {/* Leg Number */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Leg</div>
                </div>

                {/* Origin */}
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {leg.origin}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-1 flex items-center justify-center min-w-32">
                  <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative flex items-center justify-center">
                    <Plane className="w-5 h-5 text-purple-500 absolute rotate-90" />
                  </div>
                </div>

                {/* Destination */}
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {leg.destination}
                  </div>
                </div>
              </div>

              {/* Leg Price */}
              <div className="text-right ml-8 min-w-32">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  €{Math.round(leg.price)}
                </div>
                <div className="text-xs text-gray-500">per person</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
