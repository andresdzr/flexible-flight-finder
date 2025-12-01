import pandas as pd
import datetime
from geopy.distance import geodesic
import argparse

EUROPEAN_CITY_DATA = {
    # Train set Cities
    "Madrid": {"coords": (40.4168, -3.7038), "region": "South"},
    "London": {"coords": (51.5074, -0.1278), "region": "Western"},
    "Paris": {"coords": (48.8566, 2.3522), "region": "Western"},
    "Amsterdam": {"coords": (52.3676, 4.9041), "region": "Western"},
    "Rome": {"coords": (41.9028, 12.4964), "region": "South"},
    "Berlin": {"coords": (52.5200, 13.4050), "region": "Central"},
    "Vienna": {"coords": (48.2082, 16.3738), "region": "Central"},
    "Lisbon": {"coords": (38.7223, -9.1393), "region": "South"},
    "Dublin": {"coords": (53.3498, -6.2603), "region": "Western"},
    "Brussels": {"coords": (50.8503, 4.3517), "region": "Western"},
    "Athens": {"coords": (37.9838, 23.7275), "region": "South"},
    "Prague": {"coords": (50.0755, 14.4378), "region": "Central"},
    "Budapest": {"coords": (47.4979, 19.0402), "region": "Central"},
    "Warsaw": {"coords": (52.2297, 21.0122), "region": "Central"},
    "Copenhagen": {"coords": (55.6761, 12.5683), "region": "Northern"},
    "Stockholm": {"coords": (59.3293, 18.0686), "region": "Northern"},
    "Oslo": {"coords": (59.9139, 10.7522), "region": "Northern"},
    "Helsinki": {"coords": (60.1699, 24.9384), "region": "Northern"},
    "Bucharest": {"coords": (44.4268, 26.1025), "region": "Eastern"},
    "Sofia": {"coords": (42.6977, 23.3219), "region": "Eastern"},
    "Riga": {"coords": (56.9496, 24.1052), "region": "Eastern"},
    "Vilnius": {"coords": (54.6872, 25.2797), "region": "Eastern"},
    "Tallinn": {"coords": (59.4370, 24.7536), "region": "Eastern"},
    "Ljubljana": {"coords": (46.0569, 14.5058), "region": "Central"}, 
    "Bratislava": {"coords": (48.1486, 17.1077), "region": "Central"}, 
    
    # Test set Cities
    "Barcelona": {"coords": (41.3851, 2.1734), "region": "South"},
    "Milan": {"coords": (45.4642, 9.1900), "region": "South"},
    "Nice": {"coords": (43.7102, 7.2620), "region": "Western"},
    "Manchester": {"coords": (53.4808, -2.2426), "region": "Western"},
    "Frankfurt": {"coords": (50.1109, 8.6821), "region": "Central"},
    "Zurich": {"coords": (47.3769, 8.5417), "region": "Central"},
    "Krakow": {"coords": (50.0647, 19.9450), "region": "Eastern"},
    "Istanbul": {"coords": (41.0082, 28.9784), "region": "Eastern"},
    
    # Placeholder for non-mapped cities if they appear
    "Other": {"coords": (50.0, 10.0), "region": "Other"}
}
SCRAPE_DATE = datetime.datetime(2025, 11, 28)
    
def main(input_file: str, output_file: str):
    print(f"📂 Loading {input_file}...")
    try:
        df = pd.read_csv(input_file)
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

    # 2. Assign Regions
    print("🌍 Assigning Regions...")
    df['Origin_Region'] = df['Origin'].apply(lambda city: EUROPEAN_CITY_DATA.get(city, EUROPEAN_CITY_DATA['Other'])['region'])
    df['Destination_Region'] = df['Destination'].apply(lambda city: EUROPEAN_CITY_DATA.get(city, EUROPEAN_CITY_DATA['Other'])['region'])

    # 3. Calculate Distances and Coordinates
    print("📏 Calculating Distances and Extracting Coordinates...")

    distances = []
    origin_lats = []
    origin_lons = []
    dest_lats = []
    dest_lons = []
    
    for index, row in df.iterrows():
        origin_city = row['Origin']
        dest_city = row['Destination']
        
        # Look up data for both cities, using 'Other' as safe fallback
        origin_data = EUROPEAN_CITY_DATA.get(origin_city, EUROPEAN_CITY_DATA['Other'])
        dest_data = EUROPEAN_CITY_DATA.get(dest_city, EUROPEAN_CITY_DATA['Other'])
        
        coord1 = origin_data['coords']
        coord2 = dest_data['coords']
        
        # Calculate geodesic distance in kilometers
        dist_km = geodesic(coord1, coord2).km
        distances.append(int(dist_km))
        
        # Append coordinate data
        origin_lats.append(coord1[0])
        origin_lons.append(coord1[1])
        dest_lats.append(coord2[0])
        dest_lons.append(coord2[1])
            
    df['Distance_km'] = distances
    df['Origin_Lat'] = origin_lats
    df['Origin_Lon'] = origin_lons
    df['Destination_Lat'] = dest_lats
    df['Destination_Lon'] = dest_lons
    
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
    df.to_csv(output_file, index=False)
    print(f"🎉 Success! Enriched data saved to {output_file}")
    print("\nSample Data:")
    print(df.head())

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enriches a flight price CSV by adding geographical and temporal features.")
    parser.add_argument("input", help="The path to the input CSV file (e.g., google_calendar_prices.csv)", type=str)
    parser.add_argument("output", help="The path where the enriched CSV file should be saved (e.g., enriched_data.csv)", type=str)
    args = parser.parse_args()
    
    main(args.input, args.output)