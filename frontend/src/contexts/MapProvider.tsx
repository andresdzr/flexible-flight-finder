import { useState } from "react";
import type { ReactNode } from "react";
import { MapContext } from "./MapContext";
import type { FlightRoute } from "@/types/api";

export function MapProvider({ children }: { children: ReactNode }) {
  const [selectedRoute, setSelectedRoute] = useState<FlightRoute | null>(null);

  const clearSelection = () => {
    setSelectedRoute(null);
  };

  return (
    <MapContext.Provider
      value={{
        selectedRoute,
        setSelectedRoute,
        clearSelection,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
