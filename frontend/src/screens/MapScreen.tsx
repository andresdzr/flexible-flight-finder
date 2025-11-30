import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FlightMap } from "@/components/FlightMap";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import { MapProvider } from "@/contexts";

export function MapScreen() {
  return (
    <MapProvider>
      <div className="w-screen h-screen flex flex-col overflow-hidden">
        <header className="bg-background border-b px-8 py-4 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">European Flight Explorer</h1>
            <p className="text-sm text-muted-foreground">
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
