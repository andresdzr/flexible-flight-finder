import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useTheme } from "next-themes";
import { type LatLngExpression } from "leaflet";
import {
  Network,
  MapPin,
  TrendingUp,
  Info,
  Compass,
  Layers,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

const CITY_COORDS: Record<string, [number, number]> = {
  Madrid: [40.4168, -3.7038],
  London: [51.5074, -0.1278],
  Paris: [48.8566, 2.3522],
  Berlin: [52.52, 13.405],
  Rome: [41.9028, 12.4964],
  Bucharest: [44.4268, 26.1025],
  Vienna: [48.2082, 16.3738],
  Amsterdam: [52.3676, 4.9041],
  Copenhagen: [55.6761, 12.5683],
  Stockholm: [59.3293, 18.0686],
  Oslo: [59.9139, 10.7522],
  Helsinki: [60.1699, 24.9384],
  Lisbon: [38.7223, -9.1393],
  Istanbul: [41.0082, 28.9784],
  Zurich: [47.3769, 8.5417],
  Brussels: [50.8503, 4.3517],
  Dublin: [53.3498, -6.2603],
  Prague: [50.0755, 14.4378],
  Budapest: [47.4979, 19.0402],
  Athens: [37.9838, 23.7275],
  Milan: [45.4642, 9.19],
};

const CLASSIFICATION_DATA = {
  geographical: {
    western_europe: ["London", "Paris", "Amsterdam", "Brussels", "Dublin"],
    northern_europe: ["Copenhagen", "Stockholm", "Oslo", "Helsinki"],
    iberian_peninsula: ["Madrid", "Lisbon"],
    eastern_europe: ["Bucharest", "Istanbul", "Athens"],
    central_europe: [
      "Berlin",
      "Rome",
      "Vienna",
      "Zurich",
      "Prague",
      "Budapest",
      "Milan",
    ],
  },
  louvain_communities: {
    community_1: [
      "Budapest",
      "Prague",
      "Athens",
      "Madrid",
      "Stockholm",
      "Brussels",
      "Amsterdam",
      "Lisbon",
      "Zurich",
      "Milan",
      "Copenhagen",
    ],
    community_2: [
      "Vienna",
      "London",
      "Bucharest",
      "Dublin",
      "Helsinki",
      "Paris",
      "Rome",
      "Istanbul",
      "Oslo",
      "Berlin",
    ],
  },
  budget_hubs: [
    "Milan",
    "Brussels",
    "Stockholm",
    "London",
    "Rome",
    "Budapest",
    "Paris",
    "Vienna",
    "Dublin",
    "Madrid",
  ],
  hybrid_clusters: {
    cluster_0: ["Lisbon", "Stockholm", "Zurich"],
    cluster_1: [
      "Athens",
      "Brussels",
      "Copenhagen",
      "Dublin",
      "Istanbul",
      "Milan",
      "Prague",
      "Berlin",
      "Rome",
      "Vienna",
      "London",
      "Madrid",
      "Paris",
    ],
    cluster_2: ["Amsterdam", "Budapest", "Helsinki", "Oslo", "Bucharest"],
  },
};

const GEOGRAPHICAL_COLORS: Record<string, string> = {
  western_europe: "#3b82f6",
  northern_europe: "#06b6d4",
  iberian_peninsula: "#f59e0b",
  eastern_europe: "#ec4899",
  central_europe: "#8b5cf6",
};

const LOUVAIN_COLORS = {
  community_1: "#10b981",
  community_2: "#f97316",
};

const HYBRID_COLORS = {
  cluster_0: "#ef4444",
  cluster_1: "#3b82f6",
  cluster_2: "#22c55e",
};

const EUROPE_CENTER: LatLngExpression = [50.0, 10.0];

type ClassificationType = "geographical" | "louvain" | "budget" | "hybrid";

export default function ClassificationScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeClassification, setActiveClassification] =
    useState<ClassificationType>("geographical");

  const getColorForCity = (city: string): string => {
    if (activeClassification === "geographical") {
      for (const [region, cities] of Object.entries(
        CLASSIFICATION_DATA.geographical
      )) {
        if (cities.includes(city)) {
          return GEOGRAPHICAL_COLORS[region];
        }
      }
    } else if (activeClassification === "louvain") {
      for (const [community, cities] of Object.entries(
        CLASSIFICATION_DATA.louvain_communities
      )) {
        if (cities.includes(city)) {
          return LOUVAIN_COLORS[community as keyof typeof LOUVAIN_COLORS];
        }
      }
    } else if (activeClassification === "budget") {
      return CLASSIFICATION_DATA.budget_hubs.includes(city)
        ? "#10b981"
        : "#94a3b8";
    } else if (activeClassification === "hybrid") {
      for (const [cluster, cities] of Object.entries(
        CLASSIFICATION_DATA.hybrid_clusters
      )) {
        if (cities.includes(city)) {
          return HYBRID_COLORS[cluster as keyof typeof HYBRID_COLORS];
        }
      }
    }
    return "#94a3b8";
  };

  const getRadiusForCity = (city: string): number => {
    if (activeClassification === "budget") {
      const index = CLASSIFICATION_DATA.budget_hubs.indexOf(city);
      if (index === -1) return 6;
      return 12 - index * 0.5;
    }
    return 8;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <Breadcrumb
                items={[{ label: "City Classification" }]}
                className="mb-3"
              />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                European Cities Classification
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover patterns in European flight networks through
                geographical, network, and hybrid clustering analysis
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Classification Selector */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Select Classification Method
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveClassification("geographical")}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeClassification === "geographical"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <MapPin className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Geographical
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Distance-based regions
              </p>
            </button>

            <button
              onClick={() => setActiveClassification("louvain")}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeClassification === "louvain"
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Network className="w-6 h-6 mb-2 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Network Communities
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cheap-flight connections
              </p>
            </button>

            <button
              onClick={() => setActiveClassification("budget")}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeClassification === "budget"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <TrendingUp className="w-6 h-6 mb-2 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Budget Hubs
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Strategic connectors
              </p>
            </button>

            <button
              onClick={() => setActiveClassification("hybrid")}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeClassification === "hybrid"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Layers className="w-6 h-6 mb-2 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Hybrid Clustering
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ML-based patterns
              </p>
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Visualization */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Compass className="w-6 h-6" />
              Interactive Map
            </h2>
            <div className="h-[600px] rounded-lg overflow-hidden border">
              <MapContainer
                center={EUROPE_CENTER}
                zoom={4}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={
                    isDark
                      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                />
                {Object.entries(CITY_COORDS).map(([city, coords]) => {
                  const color = getColorForCity(city);
                  return (
                    <CircleMarker
                      key={`${city}-${color}`}
                      center={coords}
                      radius={getRadiusForCity(city)}
                      fillColor={color}
                      fillOpacity={0.8}
                      color="#ffffff"
                      weight={2}
                    >
                      <Tooltip
                        direction="top"
                        offset={[0, -10]}
                        permanent={false}
                      >
                        <strong>{city}</strong>
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </Card>

          {/* Legend and Explanation */}
          <div className="space-y-6">
            {/* Legend */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Legend
              </h3>
              {activeClassification === "geographical" && (
                <div className="space-y-3">
                  {Object.entries(GEOGRAPHICAL_COLORS).map(
                    ([region, color]) => (
                      <div key={region} className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {region.replace(/_/g, " ")}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
              {activeClassification === "louvain" && (
                <div className="space-y-3">
                  {Object.entries(LOUVAIN_COLORS).map(([community, color]) => (
                    <div key={community} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {community.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {activeClassification === "budget" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-[#10b981]" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Budget Hub
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-white bg-[#94a3b8]" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Other City
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    Size indicates importance ranking
                  </p>
                </div>
              )}
              {activeClassification === "hybrid" && (
                <div className="space-y-3">
                  {Object.entries(HYBRID_COLORS).map(([cluster, color]) => (
                    <div key={cluster} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {cluster.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Explanation */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Info className="w-5 h-5" />
                About This Classification
              </h3>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {activeClassification === "geographical" && (
                  <>
                    <p className="font-semibold">Distance-Based Clustering</p>
                    <p>
                      Cities are grouped based on physical proximity using the
                      Haversine formula. Both Agglomerative and Spectral
                      Clustering methods were applied, producing identical
                      results.
                    </p>
                    <p className="font-semibold mt-4">Key Insights:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>5 distinct geographical regions identified</li>
                      <li>Reflects natural European geographic divisions</li>
                      <li>
                        Provides baseline for comparing with network-based
                        methods
                      </li>
                    </ul>
                  </>
                )}
                {activeClassification === "louvain" && (
                  <>
                    <p className="font-semibold">Network Community Detection</p>
                    <p>
                      Using the Louvain algorithm on a graph where edges
                      represent cheap flights (≤€100), cities are grouped into
                      communities based on their connectivity patterns.
                    </p>
                    <p className="font-semibold mt-4">Key Insights:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>2 major travel communities discovered</li>
                      <li>Groups reflect budget airline network structure</li>
                      <li>Communities differ from geographical groupings</li>
                      <li>Shows real-world flight connectivity patterns</li>
                    </ul>
                  </>
                )}
                {activeClassification === "budget" && (
                  <>
                    <p className="font-semibold">Betweenness Centrality</p>
                    <p>
                      Cities ranked by how often they serve as bridges in the
                      cheap-flight network. Higher betweenness indicates more
                      strategic importance.
                    </p>
                    <p className="font-semibold mt-4">Top Budget Hubs:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      {CLASSIFICATION_DATA.budget_hubs
                        .slice(0, 5)
                        .map((city, idx) => (
                          <li key={city}>
                            {city} {idx === 0 && "(Most central)"}
                          </li>
                        ))}
                    </ol>
                    <p className="text-xs mt-3 text-gray-600 dark:text-gray-400">
                      These cities are optimal for multi-city routing and budget
                      travel planning.
                    </p>
                  </>
                )}
                {activeClassification === "hybrid" && (
                  <>
                    <p className="font-semibold">ML-Based Hybrid Clustering</p>
                    <p>
                      Combines Node2Vec graph embeddings with tabular features
                      (prices, distances, durations, centralities) using PCA and
                      K-means clustering.
                    </p>
                    <p className="font-semibold mt-4">Cluster Profiles:</p>
                    <div className="space-y-3 mt-2">
                      <div className="pl-3 border-l-4 border-red-500">
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          Cluster 0: High-Cost Peripheral
                        </p>
                        <p className="text-xs">
                          Expensive outliers with lower connectivity (Lisbon,
                          Stockholm, Zurich)
                        </p>
                      </div>
                      <div className="pl-3 border-l-4 border-blue-500">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                          Cluster 1: Major Hubs
                        </p>
                        <p className="text-xs">
                          High connectivity, competitive pricing, gateway cities
                          (13 cities)
                        </p>
                      </div>
                      <div className="pl-3 border-l-4 border-green-500">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          Cluster 2: Balanced Connectors
                        </p>
                        <p className="text-xs">
                          Mid-range pricing, stable connectivity (Amsterdam,
                          Budapest, etc.)
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Methodology Section */}
        <Card className="p-8 mt-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Methodology & Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Goal 1: Geography
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Identify geographical clusters using distance-based methods. By
                computing pairwise distances between cities and applying both
                Agglomerative and Spectral Clustering, we uncover natural
                geographical partitions that serve as a baseline for comparison.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Network className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Goal 2: Network
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Model Europe as a network of cheap-flight connections. Using
                Louvain Community Detection and betweenness centrality, we
                identify regions densely interconnected through affordable
                travel and find cities acting as key bridges between zones.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Goal 3: Hybrid
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Discover deeper structural patterns using Node2Vec embeddings
                and hybrid clustering. By combining graph structure with tabular
                features and applying K-means, we reveal hidden patterns like
                cities with similar cost behavior and connectivity roles.
              </p>
            </div>
          </div>
        </Card>

        {/* City Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {activeClassification === "geographical" &&
            Object.entries(CLASSIFICATION_DATA.geographical).map(
              ([region, cities]) => (
                <Card key={region} className="p-6">
                  <h3 className="text-lg font-semibold mb-3 capitalize text-gray-900 dark:text-white">
                    {region.replace(/_/g, " ")}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white"
                      style={{ backgroundColor: GEOGRAPHICAL_COLORS[region] }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {cities.length} cities
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {cities.map((city) => (
                      <li key={city} className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        {city}
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            )}

          {activeClassification === "louvain" &&
            Object.entries(CLASSIFICATION_DATA.louvain_communities).map(
              ([community, cities]) => (
                <Card key={community} className="p-6">
                  <h3 className="text-lg font-semibold mb-3 capitalize text-gray-900 dark:text-white">
                    {community.replace(/_/g, " ")}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white"
                      style={{
                        backgroundColor:
                          LOUVAIN_COLORS[
                            community as keyof typeof LOUVAIN_COLORS
                          ],
                      }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {cities.length} cities
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {cities.map((city) => (
                      <li key={city} className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        {city}
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            )}

          {activeClassification === "budget" && (
            <Card className="p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Budget Hubs Ranked by Betweenness Centrality
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {CLASSIFICATION_DATA.budget_hubs.map((city, idx) => (
                  <div
                    key={city}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {idx + 1}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {city}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeClassification === "hybrid" &&
            Object.entries(CLASSIFICATION_DATA.hybrid_clusters).map(
              ([cluster, cities]) => (
                <Card key={cluster} className="p-6">
                  <h3 className="text-lg font-semibold mb-3 capitalize text-gray-900 dark:text-white">
                    {cluster.replace(/_/g, " ")}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white"
                      style={{
                        backgroundColor:
                          HYBRID_COLORS[cluster as keyof typeof HYBRID_COLORS],
                      }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {cities.length} cities
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {cities.map((city) => (
                      <li key={city} className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        {city}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {cluster === "cluster_0" &&
                        "High-cost peripheral outliers with expensive flights and lower connectivity"}
                      {cluster === "cluster_1" &&
                        "Major European hubs with high connectivity and competitive pricing"}
                      {cluster === "cluster_2" &&
                        "Balanced mid-range connectors with moderate pricing and stable connectivity"}
                    </p>
                  </div>
                </Card>
              )
            )}
        </div>
      </div>
    </div>
  );
}
