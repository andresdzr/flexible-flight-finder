import type { FlightRoute } from "@/types/api";
import { createContext } from "react";

export interface MapContextType {
  selectedRoute: FlightRoute | null;
  setSelectedRoute: (route: FlightRoute | null) => void;
  clearSelection: () => void;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);
