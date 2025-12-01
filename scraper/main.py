import os
import time
import pandas as pd
from amadeus import Client, ResponseError
from datetime import timedelta, date

# --- CONFIGURATION ---
TEST_MODE = False  # Set to False to run the full 20-city, 6-month scrape
OUTPUT_FILE = "european_flight_network_data.csv"

# Top 20 European Capitals (plus London/major hubs)
# Using City Codes (e.g., PAR includes CDG and ORY)
# ALL_CITIES = [
#     "MAD", "LON", "PAR", "AMS", "ROM", 
#     "VIE", "LIS", "BER", "DUB", "BRU",
#     "ATH", "CPH", "OSL", "STO", "WAW",
#     "BUD", "PRG", "HEL", "ZAG", "BUH"
# ]
ALL_CITIES = [
    "MAD", "LON", "PAR", "AMS", "ROM", "LIS"
]

# Initialize Amadeus Client
amadeus = Client(
    client_id='Rz2Fb8pBAG6b1RoE5CUmR8kTyYxAiNNA',
    client_secret='6UhfJYvKEbRgewPd'
)

def get_monthly_date_ranges(start_date, months=2):
    """Generates (start, end) strings for 30-day chunks."""
    ranges = []
    current_start = start_date + timedelta(days=1)
    for _ in range(months):
        # Amadeus ranges are inclusive, usually ~30 days max works best for safety
        current_end = current_start + timedelta(days=30)
        date_str = f"{current_start.isoformat()},{current_end.isoformat()}"
        ranges.append(date_str)
        current_start = current_end + timedelta(days=1)
    return ranges

def collect_market_data():
    raw_data = []
    
    # 1. SETUP SCOPE BASED ON TEST_MODE
    if TEST_MODE:
        print("⚠️ TEST MODE ACTIVE: Running for first 2 cities and 1 month only.")
        cities_to_scrape = ALL_CITIES[:2] # First 2 cities
        months_to_scrape = 1
    else:
        print("🚀 FULL MODE ACTIVE: Running for all 20 cities and 6 months.")
        cities_to_scrape = ALL_CITIES
        months_to_scrape = 12

    # Generate date ranges
    today = date.today()
    date_ranges = get_monthly_date_ranges(today, months=months_to_scrape)
    
    total_routes = len(cities_to_scrape) * (len(cities_to_scrape) - 1)
    total_calls = total_routes * len(date_ranges)
    
    print(f"📊 Scope: {len(cities_to_scrape)} Cities | {len(date_ranges)} Date Ranges")
    print(f"🔄 Total Estimated API Calls: {total_calls}")
    print("-" * 50)

    call_counter = 0

    # --- PART 1: FETCH DATA ---
    for origin in cities_to_scrape:
        for destination in cities_to_scrape:
            if origin == destination:
                continue

            print(f"✈️ Route: {origin} -> {destination}", end=" ")
            
            route_exists = False

            for i, date_range in enumerate(date_ranges):
                call_counter += 1
                try:
                    # 💡 API CALL with DATE RANGE
                    response = amadeus.shopping.flight_dates.get(
                        origin=origin,
                        destination=destination,
                        departureDate=date_range, 
                        oneWay=True,
                        nonStop=True  # Filter for direct flights only
                    )

                    # Explicit 200 OK check
                    if response.status_code == 200 and response.data:
                        route_exists = True # Mark route as valid
                        for item in response.data:
                            raw_data.append({
                                'Origin': origin,
                                'Destination': destination,
                                'Departure_Date': item['departureDate'],
                                'Price': float(item['price']['total']),
                            })
                        print(".", end="", flush=True) # Progress dot
                    else:
                        print("x", end="", flush=True) # Valid response but empty data

                except ResponseError as error:
                    # Handle specific Amadeus errors that mean "No Flights Found"
                    if error.code == 404 or error.code == 141: 
                        print("x", end="", flush=True)
                        
                        # ⚡ OPTIMIZATION: If Month 1 (i==0) has no flights, assume route doesn't exist
                        if i == 0:
                            break 
                    else:
                        print(f"\n❌ Error {error.code}: {error.description}")
                
                # Rate limit safety
                time.sleep(0.1)
            
            if not route_exists:
                print(" [No Direct Flights]")
            else:
                print(" [Done]")

    # --- PART 2: SAVE DATA ---
    print("\n" + "=" * 50)
    if not raw_data:
        print("❌ No data collected. Check credentials or try setting nonStop=False.")
        return

    df = pd.DataFrame(raw_data)
    
    # Enrichment
    df['Departure_Date'] = pd.to_datetime(df['Departure_Date'])
    df['Week_Num'] = df['Departure_Date'].dt.isocalendar().week
    df['Month_Name'] = df['Departure_Date'].dt.month_name()
    df['Day_Name'] = df['Departure_Date'].dt.day_name()

    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"🎉 Collection Complete!")
    print(f"Total Flights Found: {len(df)}")
    print(f"Saved to: {OUTPUT_FILE}")
    print("\nSample Data:")
    print(df.head())

if __name__ == "__main__":
    collect_market_data()