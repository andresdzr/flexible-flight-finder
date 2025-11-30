import type { FlightRoute } from "@/types/api";
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Get HSL color for a price based on a gradient from green (low) to red (high)
 * Theme-aware: adjusts lightness for dark mode
 * @param price Current price
 * @param minPrice Minimum price in the dataset
 * @param maxPrice Maximum price in the dataset
 * @param isDark Whether dark mode is active
 * @returns HSL color string
 */
export const getPriceColor = (
  price: number,
  minPrice: number,
  maxPrice: number,
  isDark = false
): string => {
  // Normalize price between 0 and 1
  const normalized =
    maxPrice > minPrice ? (price - minPrice) / (maxPrice - minPrice) : 0;

  // Map to hue: 142 (green/success) -> 0 (red/destructive)
  const hue = 142 - normalized * 142;

  // Adjust saturation and lightness for theme
  const saturation = isDark ? 70 : 80;
  const lightness = isDark ? 55 : 50;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Get marker color based on price_range category
 * Theme-aware: uses CSS variables from theme
 * @param priceRange Price range category
 * @param isDark Whether dark mode is active
 * @returns HSL color string using CSS variables
 */
export const getMarkerColor = (priceRange: string): string => {
  switch (priceRange) {
    case "budget":
      return "var(--success)";
    case "moderate":
      return "hsl(from var(--success) h s calc(l - 20))"; // darker success
    case "expensive":
      return "var(--warning)";
    case "premium":
      return "var(--destructive)";
    default:
      return "var(--muted-foreground)";
  }
};

/**
 * Calculate route line thickness based on flight count
 */
export const getRouteThickness = (
  _flightCount: number,
  _minCount: number,
  _maxCount: number
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

export const getCityOpacity = (isSelected: boolean): number => {
  return isSelected ? 1.0 : 0.3;
};
