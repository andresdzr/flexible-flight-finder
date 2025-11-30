import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCheapestFlightsPerRoute } from "@/services/api";
import { toast } from "sonner";
import type { FlightDetail } from "@/types/api";
import { useMap } from "@/contexts";

export function FlightDetailsPanel() {
  const { selectedRoute, clearSelection } = useMap();
  const origin = selectedRoute?.origin || null;
  const destination = selectedRoute?.destination || null;
  const isOpen = origin && destination;

  const {
    data: flightsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["route-flights", origin, destination],
    queryFn: () =>
      fetchCheapestFlightsPerRoute(origin!.name, destination!.name),
    enabled: !!isOpen && !!origin && !!destination,
  });

  if (error) {
    toast.error("Failed to load flights", {
      description: error instanceof Error ? error.message : "Unknown error",
    });
  }

  if (!isOpen) {
    return null;
  }

  const flights = flightsData?.routes[0]?.cheapest_flights || [];

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-[calc(100vh-2rem)] overflow-hidden z-1000 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <CardTitle className="text-lg">
          {origin.name} → {destination.name}
        </CardTitle>
        <button
          onClick={clearSelection}
          className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </CardHeader>
      <CardContent className="pt-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : flights.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">
              Top {flights.length} cheapest flights (
              {flightsData?.routes[0]?.flight_count} total)
            </p>
            {flights.map((flight: FlightDetail, index: number) => (
              <div
                key={`${flight.date}-${index}`}
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-lg text-primary">
                    €{flight.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {flight.distance_km} km
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">{flight.date}</span>
                    <span className="text-muted-foreground ml-2">
                      ({flight.weekday})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No flights found for this route.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
