import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, DollarSign, Clock, Plane, Euro } from "lucide-react";
import { Card } from "@/components/ui/card";

export function FlightFinder() {
    const navigate = useNavigate();
    const [origin, setOrigin] = useState("");
    const [minDays, setMinDays] = useState(4);
    const [maxDays, setMaxDays] = useState(7);
    const [startDate, setStartDate] = useState("2025-12-30");
    const [endDate, setEndDate] = useState("2026-03-15");
    const [maxPrice, setMaxPrice] = useState(200);
    const [nonStop, setNonStop] = useState(false);
    const [oneWay, setOneWay] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const handleSearch = () => {
        const params = new URLSearchParams({
            origin,
            minDays: minDays.toString(),
            maxDays: maxDays.toString(),
            startDate,
            endDate,
            maxPrice: maxPrice.toString(),
            nonStop: nonStop.toString(),
            oneWay: oneWay.toString(),
        });
        navigate(`/results?${params.toString()}`);
    };

    return (
        <Card className="p-8 mb-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-100 dark:border-blue-900 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                    <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Flight Inspiration Search
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Flexible search for the best deals
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
                {/* Origin */}
                <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Plane className="w-4 h-4" />
                        Origin
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="City or Airport"
                        />
                    </div>
                </div>

                {/* Duration Range */}
                <div className={`space-y-2 lg:col-span-2 transition-opacity duration-200 ${oneWay ? "opacity-50 grayscale" : ""}`}>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Trip Duration (Days)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={minDays}
                            onChange={(e) => setMinDays(Number(e.target.value))}
                            disabled={oneWay}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:cursor-not-allowed"
                            placeholder="Min"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            value={maxDays}
                            onChange={(e) => setMaxDays(Number(e.target.value))}
                            disabled={oneWay}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:cursor-not-allowed"
                            placeholder="Max"
                        />
                    </div>
                </div>

                {/* Time Period */}
                <div className="space-y-2 lg:col-span-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date Range
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={today}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || today}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Max Price */}
                <div className="space-y-2 lg:col-span-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 truncate" title="Max Price (€)">
                        <Euro className="w-4 h-4 shrink-0" />
                        Max (€)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="100"
                        />
                    </div>
                </div>

                {/* Options & Search */}
                <div className="flex flex-col justify-end gap-4 lg:col-span-2">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={nonStop}
                                onChange={(e) => setNonStop(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">Non-stop</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={oneWay}
                                onChange={(e) => setOneWay(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">One way</span>
                        </label>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Search className="w-4 h-4" />
                        Search Flights
                    </button>
                </div>
            </div>
        </Card>
    )
}
