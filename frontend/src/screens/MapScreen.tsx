import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Switch } from "@/components/ui/switch";
import { FlightMap } from "@/components/FlightMap";
import { FlightGlobe } from "@/components/FlightGlobe";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import { MapProvider } from "@/contexts";
import { Globe, Map as MapIcon } from "lucide-react";

export function MapScreen() {
  const [isGlobeView, setIsGlobeView] = useState(false);

  return (
    <MapProvider>
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 w-screen h-screen flex flex-col overflow-hidden">
        <header className="border-b px-8 py-4 shrink-0 flex items-center justify-between">
          <div>
            <Breadcrumb items={[{ label: "Map Explorer" }]} className="mb-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Flexible Flight Finder
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Click on cities to explore routes • Click on routes to view
              cheapest flights
            </p>
          </div>
          <div className="flex items-center gap-6">
            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <MapIcon
                className={`w-5 h-5 transition-colors ${
                  !isGlobeView
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
              <Switch
                checked={isGlobeView}
                onCheckedChange={setIsGlobeView}
                aria-label="Toggle between map and globe view"
              />
              <Globe
                className={`w-5 h-5 transition-colors ${
                  isGlobeView
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:px-12 md:py-6 overflow-hidden">
          <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border">
            {isGlobeView ? <FlightGlobe /> : <FlightMap />}
          </div>
        </main>

        <FlightDetailsPanel />

        <Toaster />
      </div>
    </MapProvider>
  );
}
