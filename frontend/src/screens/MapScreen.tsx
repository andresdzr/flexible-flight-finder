import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { FlightMap } from "@/components/FlightMap";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import { MapProvider } from "@/contexts";

export function MapScreen() {
  return (
    <MapProvider>
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 w-screen h-screen flex flex-col overflow-hidden">
        <header className="border-b px-8 py-4 shrink-0 flex items-center justify-between">
          <div>
            <Breadcrumb items={[{ label: "Map Explorer" }]} className="mb-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              European Flight Explorer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Click on cities to explore routes • Click on routes to view
              cheapest flights
            </p>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 md:px-12 md:py-6 overflow-hidden">
          <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border">
            <FlightMap />
          </div>
        </main>

        <FlightDetailsPanel />

        <Toaster />
      </div>
    </MapProvider>
  );
}
