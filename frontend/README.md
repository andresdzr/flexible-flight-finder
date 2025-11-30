# European Flight Explorer - Frontend

An interactive web application for exploring European flight data with real-time visualization using React, TypeScript, and Leaflet maps.

## Features

- 🗺️ **Interactive Map**: Explore European cities and flight routes on an interactive Leaflet map
- 📍 **City Markers**: Color-coded markers based on price categories (budget, moderate, expensive, premium)
- ✈️ **Flight Routes**: Visualize routes with gradient colors (green to red) based on average prices
- 📊 **Route Details**: Click routes to view the top 10 cheapest flights in a floating panel
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- ⚡ **Real-time Data**: Powered by TanStack Query for efficient data fetching and caching
- 🌙 **Responsive Design**: Works seamlessly across different screen sizes

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React-Leaflet** - Map visualization
- **TanStack Query** - Data fetching and state management
- **Axios** - HTTP client
- **shadcn/ui** - UI components
- **Tailwind CSS v4** - Styling

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000` (see `../backend/README.md`)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to set your API base URL (default: `http://localhost:8000`):

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Explore Cities**: The map loads with all European cities as color-coded markers
   - Green: Budget destinations
   - Yellow: Moderate prices
   - Orange: Expensive destinations
   - Red: Premium destinations

2. **View City Details**: Hover over markers to see:
   - City name
   - Median ticket price
   - Cheapest ticket price

3. **Explore Routes**: Click on a city marker to display all flight routes from that city
   - Routes are drawn as lines with gradient colors based on average price
   - Line thickness represents the number of available flights

4. **View Flight Details**: Click on a route line to see:
   - Top 10 cheapest flights for that specific route
   - Flight dates, prices, and weekdays
   - Distance and total number of flights

5. **Close Details**: Click the X button in the flight details panel to close it

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── FlightMap.tsx         # Main map component
│   └── FlightDetailsPanel.tsx # Flight details sidebar
├── services/
│   └── api.ts                # API service layer
├── types/
│   └── api.ts                # TypeScript interfaces
├── lib/
│   ├── mapUtils.ts           # Map utilities and color functions
│   └── utils.ts              # General utilities
├── App.tsx                   # Main app component
├── main.tsx                  # App entry point
└── index.css                 # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Color Coding

### City Markers
- Based on categorical price ranges (budget/moderate/expensive/premium)
- Fixed colors for consistent identification

### Route Lines
- Dynamic HSL gradient from green (cheap) to red (expensive)
- Calculated based on average route prices
- Line thickness scales with flight count

## API Endpoints Used

- `GET /api/cities/pricing` - Fetch all cities with pricing info
- `GET /api/cities/{city}/flights` - Fetch routes from a specific city
- `GET /api/cities/routes/cheapest?origin=X&destination=Y` - Fetch cheapest flights for a route

## Development

### Adding New Features

The application uses TanStack Query for data fetching. To add a new API endpoint:

1. Add the type definitions in `src/types/api.ts`
2. Create the API function in `src/services/api.ts`
3. Use `useQuery` in your component

Example:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['myData', param],
  queryFn: () => fetchMyData(param),
  enabled: !!param,
});
```

### Styling

The project uses:
- Tailwind CSS v4 for utility classes
- shadcn/ui components for UI elements
- Custom CSS in `App.css` for Leaflet customizations

## Troubleshooting

### Map Not Loading
- Ensure Leaflet CSS is loaded in `index.html`
- Check browser console for errors
- Verify API is running and accessible

### No Cities Displayed
- Check backend API is running on correct port
- Verify `.env` has correct `VITE_API_BASE_URL`
- Check browser network tab for API errors

### Routes Not Showing
- Ensure you clicked on a city marker
- Check console for errors
- Verify backend returns route data

## License

This project is part of the UC3M Web Analytics course.
