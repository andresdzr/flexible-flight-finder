# European Flight Explorer

A full-stack web application for exploring and analyzing European flight data with interactive map visualization.

## Project Structure

```
.
├── backend/          # FastAPI backend server
├── frontend/         # React + TypeScript frontend
├── db/               # PostgreSQL database setup
├── scraper/          # Data collection scripts
└── doc/              # Documentation and diagrams
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
- 📈 Real-time data fetching with caching

## Documentation

- [Backend README](./backend/README.md) - API documentation and setup
- [Frontend README](./frontend/README.md) - UI components and usage guide
- [Database README](./db/README.md) - Database schema and setup
- [Scraper README](./scraper/README.md) - Data collection process

## Technologies

### Backend
- FastAPI
- Polars (for data processing)
- Python 3.11+

### Frontend
- React 19
- TypeScript
- React-Leaflet
- TanStack Query
- shadcn/ui + Tailwind CSS

### Database
- PostgreSQL
- Docker Compose

## License

UC3M Web Analytics Course Project
