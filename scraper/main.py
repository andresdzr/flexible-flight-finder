# Conceptual Python Structure using the Amadeus SDK
import datetime
from amadeus import Client
import pandas as pd

DESTINATIONS = ["PAR"]
# DESTINATIONS = [
#     "PAR", "BER", "ROM", "VIE", "LIS", "LON", "AMS", "BRU", "CPH", "DUB", 
#     "ATH", "STO", "WAW", "BUD", "PRG", "HEL", "OSL", "BUH", "SOF", "ZAG", 
#     "RIG", "VNO", "TLL", "LJU", "BTS"
# ]

# Top 10 largest EU capital cities with routes from Madrid to them
DESTINATIONS = [
    "LON", "PAR", "BER", "ROM", "VIE", "WAW", "BUH", "BUD", "PRG", "SOF"
]

ORIGIN = "MAD"

amadeus = Client(
    client_id='Rz2Fb8pBAG6b1RoE5CUmR8kTyYxAiNNA',
    client_secret='6UhfJYvKEbRgewPd'
)

start_date = datetime.date.today()
end_date = start_date + datetime.timedelta(days=0) # Approx 6 months
all_data = [] # List to store the results

current_date = start_date
while current_date <= end_date:
    for destination in DESTINATIONS:
        try:
            # 💡 API Call: Single-day, One-way search
            response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=ORIGIN,
                destinationLocationCode=destination,
                departureDate=current_date.isoformat(),
                adults='1' # Use 1 adult for simplest price analysis
            )

            # --- Data Extraction Logic ---
            if response.data:
                # Iterate through all offers (though we only requested max=1)
                for offer in response.data:
                    # Only one itinerary for a simple one-way search
                    itinerary = offer['itineraries'][0]
                    
                    flight_record = {
                        'Date': current_date.isoformat(),
                        'Origin': ORIGIN,
                        'Destination': destination,
                        # Price and Currency
                        'Price': float(offer['price']['total']),
                        'Currency': offer['price']['currency'],
                        # Airline (Using the validating airline)
                        'Airline': offer['validatingAirlineCodes'][0],
                        # Duration (ISO 8601 format, e.g., 'PT1H30M')
                        'Duration_ISO': itinerary['duration'], 
                        # Distance: Not available directly from this API - will be left empty for now.
                        'Distance_km': None 
                    }
                    all_data.append(flight_record)

        except Exception as e:
            print(f"Error fetching data for {destination} on {current_date}: {e}")

    current_date += datetime.timedelta(days=1)

# Final step: Save all_data to european_flight_data.csv
df = pd.DataFrame(all_data)
df.to_csv('european_flight_data.csv', index=False)
print("\n--- Data Collection Complete ---")
print(f"Total records collected: {len(df)}")
print("Saved to european_flight_data.csv")