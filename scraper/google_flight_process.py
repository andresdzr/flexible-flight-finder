import pandas as pd
import datetime
from geopy.distance import geodesic
import argparse
import airportsdata

# 1. Map City Names to their Primary International Airport IATA Code
# We use the airport code (e.g., LHR) rather than the city code (LON) 
# to ensure we get specific coordinates from the airportsdata library.
CITY_TO_IATA_MAPPING = {
    # Train set Cities
    "Madrid": "MAD",
    "London": "LHR",
    "Paris": "CDG",
    "Amsterdam": "AMS",
    "Rome": "FCO",
    "Berlin": "BER",
    "Vienna": "VIE",
    "Lisbon": "LIS",
    "Dublin": "DUB",
    "Brussels": "BRU",
    "Athens": "ATH",
    "Prague": "PRG",
    "Budapest": "BUD",
    "Warsaw": "WAW",
    "Copenhagen": "CPH",
    "Stockholm": "ARN",
    "Oslo": "OSL",
    "Helsinki": "HEL",
    "Bucharest": "OTP",
    "Sofia": "SOF",
    "Riga": "RIX",
    "Vilnius": "VNO",
    "Tallinn": "TLL",
    "Ljubljana": "LJU",
    "Bratislava": "BTS",
    
    # Test set Cities
    "Barcelona": "BCN",
    "Milan": "MXP",
    "Nice": "NCE",
    "Manchester": "MAN",
    "Frankfurt": "FRA",
    "Zurich": "ZRH",
    "Krakow": "KRK",
    "Istanbul": "IST",
}

# Define the date the data was scraped to calculate "Days Until Departure"
# NOTE: Update this date if you scrape a new batch!
SCRAPE_DATE = datetime.datetime(2025, 12, 2)

def main(input_file: str, output_file: str):
    # ---------------------------------------------------------
    # 1. Load External Data
    # ---------------------------------------------------------
    try:
        print("🌍 Loading Global Airport Database (airportsdata)...")
        airports = airportsdata.load('IATA') 
    except ImportError:
        print("❌ Error: Please install airportsdata: pip install airportsdata")
        return
    
    print(f"📂 Loading Input CSV: {input_file}...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print("❌ Input file not found. Please check the path.")
        return

    # ---------------------------------------------------------
    # 2. Clean Price Column
    # ---------------------------------------------------------
    print("🧹 Cleaning Price column...")
    # Remove currency symbols (€, $, £) and commas, convert to float
    df['Price'] = df['Price'].astype(str).str.replace(r'[^\d.]', '', regex=True)
    df['Price'] = pd.to_numeric(df['Price'], errors='coerce')
    
    # Remove rows where price conversion failed
    initial_len = len(df)
    df = df.dropna(subset=['Price'])
    if initial_len != len(df):
        print(f"   ⚠️ Dropped {initial_len - len(df)} rows with invalid prices.")
        
    df = df.rename(columns={"Price": "Price_in_EUR"})

    # ---------------------------------------------------------
    # 3. Dynamic Lookup & Feature Engineering
    # ---------------------------------------------------------
    print("✈️  Mapping Cities to IATA, Coordinates, and Countries...")

    # Helper function to look up data
    def get_route_details(row):
        origin_city = row.get('Origin')
        dest_city = row.get('Destination')
        
        # 1. Get IATA Codes from our simple dictionary
        origin_iata = CITY_TO_IATA_MAPPING.get(origin_city)
        dest_iata = CITY_TO_IATA_MAPPING.get(dest_city)
        
        # 2. Get details from airportsdata library
        # Default values if not found
        o_lat, o_lon, o_country = None, None, "Unknown"
        d_lat, d_lon, d_country = None, None, "Unknown"
        distance = None

        # Look up Origin
        if origin_iata and origin_iata in airports:
            o_data = airports[origin_iata]
            o_lat, o_lon = o_data['lat'], o_data['lon']
            o_country = o_data['country'] # Dynamically mapped!
        
        # Look up Destination
        if dest_iata and dest_iata in airports:
            d_data = airports[dest_iata]
            d_lat, d_lon = d_data['lat'], d_data['lon']
            d_country = d_data['country'] # Dynamically mapped!

        # 3. Calculate Geodesic Distance if we have both coordinates
        if o_lat and d_lat:
            distance = int(geodesic((o_lat, o_lon), (d_lat, d_lon)).km)
        
        return pd.Series([
            origin_iata, o_lat, o_lon, o_country,
            dest_iata, d_lat, d_lon, d_country,
            distance
        ])

    # Apply the function to the dataframe
    new_columns = [
        'Origin', 'Origin_Lat', 'Origin_Lon', 'Origin_Country',
        'Destination', 'Destination_Lat', 'Destination_Lon', 'Destination_Country',
        'Distance_km'
    ]
    
    df[new_columns] = df.apply(get_route_details, axis=1)

    # Remove rows where we couldn't map the city (Distance is NaN)
    # This cleans up cities that might not be in our mapping dict
    missing_data_count = df['Distance_km'].isna().sum()
    if missing_data_count > 0:
        print(f"   ⚠️ Warning: Could not calculate distance for {missing_data_count} flights (City not in mapping). Dropping them.")
        df = df.dropna(subset=['Distance_km'])

    # ---------------------------------------------------------
    # 4. Date Features Splitting
    # ---------------------------------------------------------
    print("📅 Splitting Dates...")
    df['Date'] = pd.to_datetime(df['Date'])
    
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df['Weekday'] = df['Date'].dt.day_name() # e.g., "Monday", "Tuesday"
    
    # Calculate days left (ensure you have a logical SCRAPE_DATE)
    df['Days_until_departure'] = (df['Date'] - SCRAPE_DATE).dt.days

    # ---------------------------------------------------------
    # 5. Save Final Dataset
    # ---------------------------------------------------------
    df.to_csv(output_file, index=False)
    print(f"🎉 Success! Enriched data saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enriches a flight price CSV using IATA codes and dynamic airport data.")
    parser.add_argument("input", help="The path to the input CSV file (e.g., raw_flights.csv)", type=str)
    parser.add_argument("output", help="The path where the enriched CSV file should be saved (e.g., enriched_data.csv)", type=str)
    args = parser.parse_args()
    
    main(args.input, args.output)