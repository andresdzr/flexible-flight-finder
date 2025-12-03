import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, Plane, Euro, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import classificationData from "@/assets/results.json";

export function FlightFinder() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("Madrid");
  const [minDays, setMinDays] = useState(4);
  const [maxDays, setMaxDays] = useState(7);
  const [startDate, setStartDate] = useState("2025-12-30");
  const [endDate, setEndDate] = useState("2026-03-15");
  const [maxPrice, setMaxPrice] = useState(200);
  const [nonStop, setNonStop] = useState(false);
  const [oneWay, setOneWay] = useState(false);
  const [multicity, setMulticity] = useState(false);
  const [cityTypeKey, setCityTypeKey] = useState("");

  const today = new Date().toISOString().split("T")[0];

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
      multicity: multicity.toString(),
    });
    if (multicity && cityTypeKey) {
      params.append("cityTypeKey", cityTypeKey);
    }
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

      <div className="space-y-6">
        {/* First Row: Origin and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Origin City
            </label>
            <CityAutocomplete
              value={origin}
              onChange={setOrigin}
              placeholder="Select your departure city"
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
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
                className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Second Row: Duration and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duration Range */}
          <div
            className={`space-y-2 transition-opacity duration-200 ${
              oneWay ? "opacity-50" : ""
            }`}
          >
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
                min="1"
                className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Min"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                value={maxDays}
                onChange={(e) => setMaxDays(Number(e.target.value))}
                disabled={oneWay}
                min={minDays}
                className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Max Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Maximum Price (€)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              min="0"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Maximum price"
            />
          </div>
        </div>

        {/* City Type Filter (only visible for multi-city trips) */}
        {multicity && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Filter Cities (Optional)
            </label>
            <select
              value={cityTypeKey}
              onChange={(e) => setCityTypeKey(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="">All Cities</option>
              <optgroup label="Geographical">
                <option value="western_europe">Western Europe</option>
                <option value="northern_europe">Northern Europe</option>
                <option value="iberian_peninsula">Iberian Peninsula</option>
                <option value="eastern_europe">Eastern Europe</option>
                <option value="central_europe">Central Europe</option>
              </optgroup>
              <optgroup label="Network Communities">
                <option value="louvain_community_1">Community 1</option>
                <option value="louvain_community_2">Community 2</option>
              </optgroup>
              <optgroup label="Budget Hubs">
                <option value="budget_hubs">Budget Hubs</option>
              </optgroup>
              <optgroup label="Hybrid Clusters">
                <option value="cluster_0">
                  Cluster 0 - High-Cost Peripheral
                </option>
                <option value="cluster_1">Cluster 1 - Major Hubs</option>
                <option value="cluster_2">
                  Cluster 2 - Balanced Connectors
                </option>
              </optgroup>
            </select>
            {cityTypeKey && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Limiting search to:{" "}
                {(classificationData as any)[cityTypeKey]?.join(", ") ||
                  "Unknown"}
              </p>
            )}
          </div>
        )}

        {/* Options & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={nonStop}
                onChange={(e) => setNonStop(e.target.checked)}
                disabled={multicity}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                Non-stop only
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={oneWay}
                onChange={(e) => setOneWay(e.target.checked)}
                disabled={multicity}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                One way
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={multicity}
                onChange={(e) => {
                  setMulticity(e.target.checked);
                  if (e.target.checked) {
                    setNonStop(false);
                    setOneWay(false);
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                Multi-city trip
              </span>
            </label>
          </div>
          <button
            onClick={handleSearch}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Search className="w-5 h-5" />
            Search Flights
          </button>
        </div>
      </div>
    </Card>
  );
}
