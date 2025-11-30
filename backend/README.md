# Flight Analytics Backend API

A FastAPI application for querying European flight data with pricing analytics and geocoding.

## Features

- 🚀 **Fast data loading** with Polars (in-memory processing of 117K+ flight records)
- 🗺️ **Automatic geocoding** of cities using OpenStreetMap Nominatim API
- 📊 **Smart price analytics** with outlier filtering
- 🎨 **Color-coded pricing categories** for map visualization
- 🔍 **Multiple query endpoints** for city pricing and flight details
- ⚡ **High-performance** async API with FastAPI
- 🌐 **CORS enabled** for frontend integration

## Setup

### Prerequisites

- Python 3.11 or higher
- pip

### Installation

1. Create a virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Install dependencies:
```powershell
pip install -r requirements.txt
```

3. Create `.env` file (optional):
```bash
cp .env.example .env
```

Edit `.env` to customize settings if needed.

## Usage

### Basic Usage

Start the server with default settings:
```powershell
python -m app.main
```

The API will be available at `http://localhost:8000`

### Command Line Options

```powershell
# Custom host and port
python -m app.main --host 0.0.0.0 --port 8080

# Custom data path
python -m app.main --data-path ../scraper/european_flight_data_enriched.csv

# Enable auto-reload for development
python -m app.main --reload

# Custom geocode cache location
python -m app.main --geocode-cache my_cache.json

# Show all options
python -m app.main --help
```

### Development Mode

For development with auto-reload:
```powershell
python -m app.main --reload
```

## API Endpoints

### Root Endpoints

- **GET /** - API information and available endpoints
- **GET /health** - Health check with data loading status
- **GET /docs** - Interactive API documentation (Swagger UI)
- **GET /openapi.json** - OpenAPI schema

### City Pricing

**GET /api/cities/pricing**

Returns average pricing for all destination cities with color categories for map visualization.

**Response:**
```json
{
  "cities": [
    {
      "city": {
        "name": "Madrid",
        "coords": {
          "lat": 40.4168,
          "lon": -3.7038
        }
      },
      "average_price": 85.50,
      "price_range": "moderate",
      "color_category": "#3b82f6",
      "flight_count": 1250
    }
  ],
  "total_cities": 25
}
```

**Price Ranges:**
- `budget` (green #22c55e): < €50
- `moderate` (blue #3b82f6): €50-€100
- `expensive` (amber #f59e0b): €100-€200
- `premium` (red #ef4444): > €200

### City Flights

**GET /api/cities/{city_name}/flights**

Returns all flight routes from a specific city with price ranges and top 5 cheapest flights.

**Example:** `/api/cities/Madrid/flights`

**Response:**
```json
{
  "origin_city": {
    "name": "Madrid",
    "coords": {
      "lat": 40.4168,
      "lon": -3.7038
    }
  },
  "routes": [
    {
      "destination": {
        "name": "Barcelona",
        "coords": {
          "lat": 41.3851,
          "lon": 2.1734
        }
      },
      "avg_price": 65.00,
      "min_price": 35.00,
      "max_price": 120.00,
      "flight_count": 85
    }
  ],
  "cheapest_flights": [
    {
      "origin": {
        "name": "Madrid",
        "coords": {
          "lat": 40.4168,
          "lon": -3.7038
        }
      },
      "destination": {
        "name": "Barcelona",
        "coords": {
          "lat": 41.3851,
          "lon": 2.1734
        }
      },
      "date": "2025-12-15",
      "price": 35.00,
      "distance_km": 505,
      "weekday": "Monday",
      "year": 2025,
      "month": 12,
      "day": 15
    }
  ],
  "total_routes": 24
}
```

## Data Processing

### Outlier Filtering

The API uses smart outlier filtering to provide accurate price estimates:

- **High outliers excluded**: Top 10% of prices are excluded from averages
- **Low outliers kept**: Cheap flights are always included (important for finding deals)
- **Minimum data requirement**: Outlier filtering only applies when 10+ data points exist

### Geocoding

Cities are automatically geocoded using OpenStreetMap Nominatim API:

- **Automatic caching**: Results saved to `geocode_cache.json`
- **Rate limiting**: Respects 1 request/second limit
- **Persistent cache**: Cache survives server restarts
- **25 cities**: Pre-geocoded on first run

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app and CLI
│   ├── config.py         # Settings and configuration
│   ├── schemas.py        # Pydantic models
│   ├── data_loader.py    # Data loading and geocoding
│   └── routes.py         # API endpoints
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Technology Stack

- **FastAPI** - Modern async web framework
- **Polars** - High-performance DataFrame library
- **Pydantic** - Data validation
- **Requests** - HTTP client for geocoding
- **Uvicorn** - ASGI server

## Development

### Code Style

The project follows PEP 8 style guidelines. Key points:

- Type hints for all functions
- Docstrings for classes and public methods
- Async/await for I/O operations
- Clear variable naming

### Adding New Endpoints

1. Add schemas to `app/schemas.py`
2. Add route handler to `app/routes.py`
3. Use `get_data_loader()` to access data
4. Return Pydantic models for automatic validation

## Troubleshooting

### Data not loading

- Check that CSV path is correct (default: `../scraper/european_flight_data_enriched.csv`)
- Verify CSV file exists and has correct format
- Check logs for specific error messages

### Geocoding issues

- Ensure internet connection is available
- Check that `geocode_cache.json` has correct permissions
- Delete cache file to force re-geocoding

### CORS errors

- Frontend URL must be in allowed origins (default: `http://localhost:5173`)
- Check browser console for specific CORS error
- Modify CORS settings in `app/main.py` if needed

## License

Educational project for UC3M Web Analytics course.
