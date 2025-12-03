# Flexible Flight Finder

A full-stack web application for exploring and analyzing European flight data with interactive map visualization.

## Project Structure

```
.
├── backend/          # FastAPI backend server
├── frontend/         # React + TypeScript frontend
├── model/            # Flight Price Prediction Model and Trip Optimizer
└── scraper/          # Data collection scripts
```

## Quick Start

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

Backend will run on `http://localhost:8000`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Open the Application

Navigate to `http://localhost:5173` in your browser to explore the flight map!

## Features

- 🗺️ Interactive map of European cities with flight routes
- 📊 Price-based color coding for easy comparison
- ✈️ Dynamic route visualization with gradient colors
- 💰 Cheapest flight finder per route
- 🔮 ML-powered price forecasting
- ✨ Automatic detection of flights priced significantly below prediction
- 📈 Real-time data fetching with caching

## Documentation

- [Backend README](./backend/README.md) - API documentation and setup
- [Frontend README](./frontend/README.md) - UI components and usage guide
- [Scraper README](./scraper/README.md) - Data collection process
- [Price Prediction Model README](./model/README.md) - XGBoost Price Prediction Model
- [Classification Model README](./model/Kayak%20Data%20model/README.md) - Classification Model Description
- [Optimization Model README](./model/Optimization%20Model/README.md) - Optimizer Model Description

## Technologies

### Backend
- FastAPI
- Polars (for data processing)
- Python 3.11+
- XGBoost & Scikit-Learn (for price prediction)

### Frontend
- React 19
- TypeScript
- React-Leaflet
- TanStack Query
- shadcn/ui + Tailwind CSS


## License

UC3M Web Analytics Course Project
