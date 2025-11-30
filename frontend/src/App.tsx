import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { FlightMap } from "@/components/FlightMap";
import { FlightDetailsPanel } from "@/components/FlightDetailsPanel";
import "./App.css";

function App() {
  const [selectedRoute, setSelectedRoute] = useState<{
    origin: string;
    destination: string;
  } | null>(null);

  const handleRouteSelect = (origin: string, destination: string) => {
    setSelectedRoute({ origin, destination });
  };

  const handleClosePanel = () => {
    setSelectedRoute(null);
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <header className="bg-background border-b px-8 py-4 shrink-0">
        <h1 className="text-2xl font-bold">European Flight Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Click on cities to explore routes • Click on routes to view cheapest
          flights
        </p>
      </header>

      <main className="flex-1 p-4 md:px-12 md:py-6 overflow-hidden">
        <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border">
          <FlightMap onRouteSelect={handleRouteSelect} />
        </div>
      </main>

      <FlightDetailsPanel
        origin={selectedRoute?.origin || null}
        destination={selectedRoute?.destination || null}
        onClose={handleClosePanel}
      />

      <Toaster />
    </div>
  );
}

export default App;
