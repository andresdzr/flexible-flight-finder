import argparse
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.data_loader import DataLoader
from app import data_loader as data_loader_module
from app.routes import router
from app.statistics import router as statistics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Loads data on startup and cleans up on shutdown.
    """
    # Startup: Load data
    print("=" * 60)
    print("Starting Flight Analytics API")
    print("=" * 60)

    try:
        loader = DataLoader(
            csv_path=settings.data_path, cache_path=settings.geocode_cache_path
        )
        loader.load_data()
        data_loader_module.data_loader = loader
        print("Data loaded successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"Error loading data: {e}")
        print("=" * 60)
        sys.exit(1)

    yield

    # Shutdown: Cleanup
    print("\nShutting down Flight Analytics API...")


# Create FastAPI application
app = FastAPI(
    title="Flight Analytics API",
    description="API for querying European flight data with pricing analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)
app.include_router(statistics_router)


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": "Flight Analytics API",
        "version": "1.0.0",
        "endpoints": {
            "cities_pricing": "/api/cities/pricing",
            "city_flights": "/api/cities/{city_name}/flights",
            "statistics": "/api/statistics",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    loader = data_loader_module.data_loader
    return {
        "status": "healthy",
        "data_loaded": loader is not None and loader.df is not None,
        "flight_count": len(loader.df) if loader and loader.df is not None else 0,
        "cities_geocoded": len(loader.geocode_cache) if loader else 0,
    }


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Flight Analytics API Server",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument(
        "--host", type=str, default=settings.host, help="Host to bind the server to"
    )

    parser.add_argument(
        "--port", type=int, default=settings.port, help="Port to bind the server to"
    )

    parser.add_argument(
        "--data-path",
        type=str,
        default=settings.data_path,
        help="Path to the CSV data file",
    )

    parser.add_argument(
        "--reload",
        action="store_true",
        default=settings.reload,
        help="Enable auto-reload for development",
    )

    parser.add_argument(
        "--geocode-cache",
        type=str,
        default=settings.geocode_cache_path,
        help="Path to geocode cache file",
    )

    return parser.parse_args()


def main():
    """Main entry point for the application."""
    args = parse_args()

    # Override settings with CLI arguments
    settings.host = args.host
    settings.port = args.port
    settings.data_path = args.data_path
    settings.reload = args.reload
    settings.geocode_cache_path = args.geocode_cache

    print(f"\nStarting server with:")
    print(f"  Host: {settings.host}")
    print(f"  Port: {settings.port}")
    print(f"  Data path: {settings.data_path}")
    print(f"  Reload: {settings.reload}")
    print(f"  Geocode cache: {settings.geocode_cache_path}")
    print()

    # Run the server
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
