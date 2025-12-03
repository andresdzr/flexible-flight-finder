import pandas as pd
from datetime import datetime
import airportsdata
import io

# --- CONFIGURATION ---
INPUT_FILE = 'vuelos_kayak_clean_final.csv'
OUTPUT_FILE = 'kayak_data.csv'

def process_flight_data():
    try:
        # Load airports data (IATA code as key)
        print("Loading airport database...")
        airports = airportsdata.load('IATA') 
    except ImportError:
        print("Error: Please install airportsdata: pip install airportsdata")
        return

    try:
        df = pd.read_csv(INPUT_FILE)
        print("Data loaded successfully.")
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return

    # helper function to fetch lat/lon
    def get_airport_info(iata_code):
        airport = airports.get(iata_code)
        if airport:
            return pd.Series([airport['lat'], airport['lon']])
        else:
            return pd.Series([None, None])

    df = df[df['Stops_Numeric'] == 0]

    print("Fetching coordinates...")
    # Apply lookup for Origin
    df[['Origin_Lat', 'Origin_Lon']] = df['origen_iata'].apply(get_airport_info)
    # Apply lookup for Destination
    df[['Destination_Lat', 'Destination_Lon']] = df['destino_iata'].apply(get_airport_info)

    print("Processing dates...")
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Extract date
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df['Weekday'] = df['Date'].dt.day_name()
    
    # Calculate Days until departure (hardcoded)
    scrape_date = pd.to_datetime("2025-12-01")
    df['Days_until_departure'] = (df['Date'] - scrape_date).dt.days
    
    # Creating the new dataframe structure
    output_df = pd.DataFrame()
    
    output_df['Origin'] = df['origen_iata']
    output_df['Destination'] = df['destino_iata']
    output_df['Date'] = df['Date'].dt.date 
    output_df['Price_in_€'] = df['precio']
    
    # No matter, won't be used
    output_df['Origin_Country'] = df['Origin_Country'] 
    output_df['Destination_Country'] = df['Dest_Country']
    
    output_df['Distance_km'] = df['Distance_km']
    
    # Coordinates derived earlier
    output_df['Origin_Lat'] = df['Origin_Lat']
    output_df['Origin_Lon'] = df['Origin_Lon']
    output_df['Destination_Lat'] = df['Destination_Lat']
    output_df['Destination_Lon'] = df['Destination_Lon']
    
    output_df['Year'] = df['Year']
    output_df['Month'] = df['Month']
    output_df['Day'] = df['Day']
    output_df['Weekday'] = df['Weekday']
    output_df['Days_until_departure'] = df['Days_until_departure']

    print(f"Exporting to {OUTPUT_FILE}...")
    output_df = output_df.round({'Origin_Lat': 6, 'Origin_Lon': 6, 'Destination_Lat': 6, 'Destination_Lon': 6})
    
    output_df.to_csv(OUTPUT_FILE, index=False)
    print("Preview:")
    print(output_df.head())

if __name__ == "__main__":
    process_flight_data()