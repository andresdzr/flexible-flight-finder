import type { FlightRoute } from "@/types/api";
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Get HSL color for a price based on a gradient from green (low) to red (high)
 * @param price Current price
 * @param minPrice Minimum price in the dataset
 * @param maxPrice Maximum price in the dataset
 * @returns HSL color string
 */
export const getPriceColor = (
  price: number,
  minPrice: number,
  maxPrice: number
): string => {
  // Normalize price between 0 and 1
  const normalized =
    maxPrice > minPrice ? (price - minPrice) / (maxPrice - minPrice) : 0;

  // Map to hue: 120 (green) -> 0 (red)
  const hue = 120 - normalized * 120;

  return `hsl(${hue}, 80%, 50%)`;
};

/**
 * Get marker color based on price_range category
 */
export const getMarkerColor = (priceRange: string): string => {
  switch (priceRange) {
    case "budget":
      return "#22c55e"; // green-500
    case "moderate":
      return "#eab308"; // yellow-500
    case "expensive":
      return "#f97316"; // orange-500
    case "premium":
      return "#ef4444"; // red-500
    default:
      return "#6b7280"; // gray-500
  }
};

/**
 * Calculate route line thickness based on flight count
 */
export const getRouteThickness = (
  flightCount: number,
  minCount: number,
  maxCount: number
): number => {
  // const minThickness = 2;
  // const maxThickness = 8;

  // if (maxCount <= minCount) return minThickness;

  // const normalized = (flightCount - minCount) / (maxCount - minCount);
  // return minThickness + normalized * (maxThickness - minThickness);
  return 2;
};

/**
 * Get price range for routes to calculate gradient colors
 */
export const getRoutePriceRange = (
  routes: FlightRoute[]
): { min: number; max: number } => {
  if (routes.length === 0) return { min: 0, max: 100 };

  const prices = routes.map((r) => r.avg_price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

/**
 * Get flight count range for routes to calculate thickness
 */
export const getRouteFlightCountRange = (
  routes: FlightRoute[]
): { min: number; max: number } => {
  if (routes.length === 0) return { min: 0, max: 100 };

  const counts = routes.map((r) => r.flight_count);
  return {
    min: Math.min(...counts),
    max: Math.max(...counts),
  };
};

export const getRouteOpacity = (isSelected: boolean): number => {
  return isSelected ? 0.7 : 0.2;
};
