import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Plane, Calendar, MapPin } from "lucide-react";
import type { TripOption, FlightSearchResponse } from "@/types/api";

export default function FlightResultsScreen() {
  const [searchParams] = useSearchParams();
  const minDays = searchParams.get("minDays");
  const maxDays = searchParams.get("maxDays");
  const startMonth = searchParams.get("startMonth");
  const endMonth = searchParams.get("endMonth");
  const maxPrice = searchParams.get("maxPrice");
  const nonStop = searchParams.get("nonStop") === "true";
  const oneWay = searchParams.get("oneWay") === "true";

  const [trips, setTrips] = useState<TripOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (minDays) params.append("min_days", minDays);
        if (maxDays) params.append("max_days", maxDays);
        if (startMonth) params.append("start_month", startMonth);
        if (endMonth) params.append("end_month", endMonth);
        if (maxPrice) params.append("max_price", maxPrice);
        if (nonStop) params.append("non_stop", "true");
        if (oneWay) params.append("one_way", "true");

        const response = await fetch(
          `http://localhost:8000/api/search/flights?${params.toString()}`
        );
        const data: FlightSearchResponse = await response.json();
        setTrips(data.trips);
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [minDays, maxDays, startMonth, endMonth, maxPrice, nonStop, oneWay]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSelectTrip = (index: number) => {
    setSelectedTrip(index);
    // Here you could add logic to proceed to booking, etc.
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Flight Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {oneWay ? "One-way flights" : "Round-trip flights"} sorted by
              price
            </p>
          </div>

          {/* Search Summary */}
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-blue-900">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>
                  {startMonth} - {endMonth}
                </span>
              </div>
              {!oneWay && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>
                    {minDays}-{maxDays} days
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">Max Budget:</span>
                <span>€{maxPrice}</span>
              </div>
              {nonStop && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  Non-stop
                </span>
              )}
            </div>
          </Card>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">
              Loading flights...
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && trips.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No flights found matching your criteria. Try adjusting your
              filters.
            </p>
          </Card>
        )}

        {/* Results List */}
        <div className="space-y-4">
          {trips.map((trip, index) => (
            <Card
              key={index}
              className={`p-6 transition-all duration-300 cursor-pointer ${
                selectedTrip === index
                  ? "border-2 border-blue-500 shadow-lg"
                  : "border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg"
              }`}
              onClick={() => handleSelectTrip(index)}
            >
              <div className="space-y-4">
                {/* Outbound Flight */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Outbound
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(trip.outbound_flight.date)} •{" "}
                        {trip.outbound_flight.weekday}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {trip.outbound_flight.origin.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Origin
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col items-center px-4">
                        <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative flex items-center justify-center">
                          <Plane className="w-4 h-4 text-blue-500 absolute rotate-90" />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {trip.outbound_flight.distance_km} km
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {trip.outbound_flight.destination.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Destination
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          €{trip.outbound_flight.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Flight */}
                {trip.return_flight && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Plane className="w-4 h-4 text-purple-600 dark:text-purple-400 rotate-180" />
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            Return
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(trip.return_flight.date)} •{" "}
                            {trip.return_flight.weekday}
                          </span>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {trip.return_flight.origin.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Origin
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col items-center px-4">
                            <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative flex items-center justify-center">
                              <Plane className="w-4 h-4 text-purple-500 absolute -rotate-90" />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {trip.return_flight.distance_km} km
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {trip.return_flight.destination.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Destination
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              €{trip.return_flight.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Trip Summary & Price */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {trip.return_flight && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.trip_duration_days} days trip</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        €{trip.total_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trip.return_flight
                          ? "Total for round trip"
                          : "One way"}
                      </div>
                    </div>
                    <button
                      className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                        selectedTrip === index
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTrip(index);
                      }}
                    >
                      {selectedTrip === index ? "Selected" : "Select"}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
