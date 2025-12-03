import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MulticityTripCard } from "@/components/MulticityTripCard";
import {
  Plane,
  Clock,
  Euro,
  Calendar,
  Ruler,
  Loader2,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { FlightDetail, MulticitySearchResponse } from "@/types/api";

export default function FlightResultsScreen() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get("origin");
  const minDays = searchParams.get("minDays");
  const maxDays = searchParams.get("maxDays");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const maxPrice = searchParams.get("maxPrice");
  const nonStop = searchParams.get("nonStop") === "true";
  const oneWay = searchParams.get("oneWay") === "true";
  const multicity = searchParams.get("multicity") === "true";
  const cityTypeKey = searchParams.get("cityTypeKey");

  const [flights, setFlights] = useState<FlightDetail[]>([]);
  const [multicityTrip, setMulticityTrip] =
    useState<MulticitySearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);

        if (multicity) {
          // Fetch multicity trip
          const params = new URLSearchParams();
          if (origin) params.append("origin", origin);
          if (startDate) params.append("start_date", startDate);
          if (endDate) params.append("end_date", endDate);
          if (maxPrice) params.append("max_price", maxPrice);
          if (cityTypeKey) params.append("city_type_key", cityTypeKey);

          const response = await fetch(
            `http://localhost:8000/api/search/flights/multicity?${params.toString()}`
          );
          const data = await response.json();
          setMulticityTrip(data);
        } else {
          // Fetch regular flights
          const params = new URLSearchParams();
          if (minDays) params.append("min_days", minDays);
          if (maxDays) params.append("max_days", maxDays);
          if (startDate) params.append("start_date", startDate);
          if (endDate) params.append("end_date", endDate);
          if (maxPrice) params.append("max_price", maxPrice);
          if (nonStop) params.append("non_stop", "true");
          if (oneWay) params.append("one_way", "true");
          if (origin) params.append("origin", origin);

          const response = await fetch(
            `http://localhost:8000/api/search/flights?${params.toString()}`
          );
          const data = await response.json();
          setFlights(data.flights);
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [
    minDays,
    maxDays,
    startDate,
    endDate,
    maxPrice,
    nonStop,
    oneWay,
    origin,
    multicity,
    cityTypeKey,
  ]);

  const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode) return "";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateTripDuration = (departDate: string, returnDate?: string) => {
    if (!returnDate) return null;
    try {
      const depart = new Date(departDate);
      const ret = new Date(returnDate);
      const diffTime = Math.abs(ret.getTime() - depart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Flight Results" },
              ]}
              className="mb-1"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Flight Results
            </h1>
          </div>

          {/* Search Summary */}
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-blue-900">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {origin && (
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-500" />
                  <span>From {origin}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>
                  {`${startDate} - ${endDate}`}
                </span>
              </div>
              {!oneWay && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>
                    {minDays}-{maxDays} days
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-blue-500" />
                <span>Max €{maxPrice}</span>
              </div>
              {nonStop && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  Non-stop
                </span>
              )}
              {oneWay && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  One way
                </span>
              )}
              {multicity && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                  Multi-city
                </span>
              )}
            </div>
          </Card>
        </header>

        {/* Results List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {multicity
                  ? "Optimizing your multi-city trip..."
                  : "Searching for best flights..."}
              </p>
            </div>
          ) : multicity && multicityTrip ? (
            multicityTrip.status === "success" && multicityTrip.trip ? (
              <MulticityTripCard trip={multicityTrip.trip} />
            ) : (
              <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <Plane className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 rotate-45" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No optimal trip found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {multicityTrip.message ||
                    "We couldn't find an optimal multi-city trip within your budget. Try increasing your budget or adjusting your dates."}
                </p>
              </div>
            )
          ) : flights.length === 0 ? (
            <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <Plane className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 rotate-45" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No flights found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                We couldn't find any flights matching your criteria. Try
                adjusting your dates or filters.
              </p>
            </div>
          ) : (
            flights.map((flight, index) => {
              const originName = flight.origin?.name || "Unknown";
              const destName = flight.destination?.name || "Unknown";
              const originCountry = flight.origin?.country_code;
              const destCountry = flight.destination?.country_code;
              const tripDuration = calculateTripDuration(
                flight.date,
                flight.return_date
              );

              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-all duration-300 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Flight Info */}
                    <div className="flex-1">
                      {/* Route */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-6 flex-1">
                          {/* Origin */}
                          <div className="flex flex-col items-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                              {originName}
                            </div>
                            <div className="text-3xl">
                              {getFlagEmoji(originCountry)}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex-1 flex flex-col items-center min-w-32">
                            <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative flex items-center justify-center">
                              <div className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full left-0"></div>
                              <Plane className="w-5 h-5 text-blue-500 absolute rotate-90" />
                              {flight.return_date && (
                                <ArrowRightLeft className="w-4 h-4 text-gray-400 absolute -bottom-4" />
                              )}
                              <div className="absolute w-1.5 h-1.5 border-2 border-blue-500 rounded-full right-0 bg-white dark:bg-gray-800"></div>
                            </div>
                          </div>

                          {/* Destination */}
                          <div className="flex flex-col items-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                              {destName}
                            </div>
                            <div className="text-3xl">
                              {getFlagEmoji(destCountry)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Flight Details */}
                      <div className="flex flex-wrap gap-4">
                        {/* Departure Date */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <div className="text-sm">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Departure
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(flight.date)}
                            </div>
                          </div>
                        </div>

                        {/* Return Date */}
                        {flight.return_date && (
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <div className="text-sm">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Return
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {formatDate(flight.return_date)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Trip Duration */}
                        {tripDuration && (
                          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <div className="text-sm">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Duration
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {tripDuration} days
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Distance */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                          <Ruler className="w-4 h-4 text-gray-500" />
                          <div className="text-sm">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Distance
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {flight.distance_km
                                ? `${Math.round(flight.distance_km)} km`
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex lg:flex-col items-center justify-between gap-4 lg:border-l lg:pl-8 border-gray-100 dark:border-gray-700 lg:min-w-40">
                      <div className="text-right w-full lg:w-auto">
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          €{Math.round(flight.price)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          per person
                        </div>
                        {flight.price_trend && (
                          <div
                            className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                              flight.price_trend === "falling"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : flight.price_trend === "rising"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {flight.price_trend === "falling" ? (
                              <>
                                <TrendingDown className="w-3 h-3" />
                                <span>Price expected to fall in the next 7 days</span>
                              </>
                            ) : flight.price_trend === "rising" ? (
                              <>
                                <TrendingUp className="w-3 h-3" />
                                <span>Price expected to rise in the next 7 days</span>
                              </>
                            ) : (
                              <>
                                <Minus className="w-3 h-3" />
                                <span>Price expected to be stable in the next 7 days</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <button className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full active:scale-95">
                        Select Flight
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
