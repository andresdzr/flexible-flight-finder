import { useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ArrowLeft, Plane, Clock, DollarSign, Calendar } from "lucide-react";

export default function FlightResultsScreen() {
    const [searchParams] = useSearchParams();
    const minDays = searchParams.get("minDays");
    const maxDays = searchParams.get("maxDays");
    const startMonth = searchParams.get("startMonth");
    const endMonth = searchParams.get("endMonth");
    const maxPrice = searchParams.get("maxPrice");
    const nonStop = searchParams.get("nonStop") === "true";
    const oneWay = searchParams.get("oneWay") === "true";

    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

                const response = await fetch(`http://localhost:8000/api/search/flights?${params.toString()}`);
                const data = await response.json();
                setFlights(data.flights);
            } catch (error) {
                console.error("Error fetching flights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, [minDays, maxDays, startMonth, endMonth, maxPrice, nonStop, oneWay]);

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Link to="/" className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </Link>
                        <div>
                            <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Flight Results" }]} className="mb-1" />
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Flight Results
                            </h1>
                        </div>
                    </div>

                    {/* Search Summary */}
                    <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>{startMonth} - {endMonth}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span>{minDays}-{maxDays} days</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-500" />
                                <span>Max €{maxPrice}</span>
                            </div>
                            {nonStop && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">Non-stop</span>}
                            {oneWay && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">One way</span>}
                        </div>
                    </Card>
                </header>

                {/* Results List */}
                <div className="space-y-4">
                    {flights.map((flight, index) => (
                        <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-transparent hover:border-blue-200 dark:hover:border-blue-800 group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Flight Info */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">{flight.airline || "Airline"}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{flight.date}</span>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{flight.departure || "12:00"}</div>
                                            <div className="text-sm text-gray-500">MAD</div>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center px-4">
                                            <div className="text-xs text-gray-500 mb-1">{flight.duration || "2h 30m"}</div>
                                            <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative flex items-center justify-center">
                                                <Plane className="w-4 h-4 text-blue-500 absolute rotate-90" />
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{flight.stops || "Non-stop"}</div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{flight.arrival || "14:30"}</div>
                                            <div className="text-sm text-gray-500">{flight.destination.name}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Action */}
                                <div className="flex md:flex-col items-center justify-between gap-4 md:border-l md:pl-6 border-gray-100 dark:border-gray-700 min-w-[150px]">
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">€{flight.price}</div>
                                        <div className="text-xs text-gray-500">per person</div>
                                    </div>
                                    <button className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors w-full">
                                        Select
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
