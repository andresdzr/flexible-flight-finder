import pandas as pd
import datetime
from geopy.distance import geodesic

# --- CONFIGURATION ---
INPUT_FILE = "google_calendar_prices.csv"
OUTPUT_FILE = "european_flight_data_enriched.csv"
CITY_COORDINATES = {
    "Madrid": (40.4168, -3.7038),
    "London": (51.5074, -0.1278),
    "Paris": (48.8566, 2.3522),
    "Amsterdam": (52.3676, 4.9041),
    "Rome": (41.9028, 12.4964),
    "Berlin": (52.5200, 13.4050),
    "Vienna": (48.2082, 16.3738),
    "Lisbon": (38.7223, -9.1393),
    "Dublin": (53.3498, -6.2603),
    "Brussels": (50.8503, 4.3517),
    "Athens": (37.9838, 23.7275),
    "Prague": (50.0755, 14.4378),
    "Budapest": (47.4979, 19.0402),
    "Warsaw": (52.2297, 21.0122),
    "Copenhagen": (55.6761, 12.5683),
    "Stockholm": (59.3293, 18.0686),
    "Oslo": (59.9139, 10.7522),
    "Helsinki": (60.1699, 24.9384),
    "Bucharest": (44.4268, 26.1025),
    "Sofia": (42.6977, 23.3219),
    "Riga": (56.9496, 24.1052),
    "Vilnius": (54.6872, 25.2797),
    "Tallinn": (59.4370, 24.7536),
    "Ljubljana": (46.0569, 14.5058),
    "Bratislava": (48.1486, 17.1077)
}
SCRAPE_DATE = datetime.datetime(2025, 11, 30)

def enrich_data():
    print(f"📂 Loading {INPUT_FILE}...")
    try:
        df = pd.read_csv(INPUT_FILE)
    except FileNotFoundError:
        print("❌ Input file not found. Run the scraper first.")
        return

    # 1. Clean Price Column
    print("🧹 Cleaning Price column...")
    # Remove currency symbols and non-numeric chars, then convert to float
    df['Price'] = df['Price'].astype(str).str.replace(r'[^\d.]', '', regex=True)
    df['Price'] = pd.to_numeric(df['Price'], errors='coerce')
    
    # Drop invalid rows
    initial_len = len(df)
    df = df.dropna(subset=['Price'])
    if initial_len != len(df):
        print(f"   Dropped {initial_len - len(df)} rows with invalid prices.")
        
    df = df.rename(columns={"Price": "Price_in_€"})

    # 2. Static Geocoding
    city_coords = CITY_COORDINATES

    # 3. Calculate Distances
    print("kb Calculating Distances...")
    print(city_coords)
    distances = []
    
    for index, row in df.iterrows():
        origin = row['Origin']
        dest = row['Destination']
        
        if origin in city_coords and dest in city_coords:
            coord1 = city_coords[origin]
            coord2 = city_coords[dest]
            # Calculate geodesic distance in kilometers
            dist_km = geodesic(coord1, coord2).km
            distances.append(int(dist_km))
        else:
            distances.append(None) # Could not calculate
            
    df['Distance_km'] = distances
    
    # Drop rows where distance couldn't be calculated
    df = df.dropna(subset=['Distance_km'])

    # 4. Date Features Splitting
    print("📅 Splitting Dates...")
    df['Date'] = pd.to_datetime(df['Date'])
    
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df['Weekday'] = df['Date'].dt.day_name() # e.g., "Monday", "Tuesday"
    df['Days_until_departure'] = df['Days_until_departure'] = (df['Date'] - SCRAPE_DATE).dt.days

    # 5. Save Final Dataset
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"🎉 Success! Enriched data saved to {OUTPUT_FILE}")
    print("\nSample Data:")
    print(df.head())

if __name__ == "__main__":
    enrich_data()