import airportsdata
from typing import Optional, Dict

class AirportService:
    def __init__(self):
        # Load airports data using IATA codes as keys
        self.airports = airportsdata.load('IATA')
        # Manual mapping for major city codes that might not be in airportsdata as airports
        self.CITY_CODES = {
            "paris": "PAR",
            "london": "LON",
            "new york": "NYC",
            "rome": "ROM",
            "milan": "MIL",
            "moscow": "MOW",
            "berlin": "BER",
            "tokyo": "TYO",
            "osaka": "OSA",
            "beijing": "BJS",
            "bangkok": "BKK",
            "istanbul": "IST",
            "rio de janeiro": "RIO",
            "sao paulo": "SAO",
        }

        # Build city name to IATA code mapping
        self.city_map = {}
        for code, data in self.airports.items():
            if data.get('city'):
                city_lower = data['city'].lower()
                if city_lower not in self.city_map:
                    self.city_map[city_lower] = []
                self.city_map[city_lower].append(code)
        
        # Add manual city codes
        for city, code in self.CITY_CODES.items():
            if city in self.city_map:
                if code not in self.city_map[city]:
                    self.city_map[city].append(code)
            else:
                self.city_map[city] = [code]

    def get_city_name(self, iata_code: str) -> str:
        """
        Get city name by IATA code.
        Returns the city name if found, otherwise returns the code itself.
        """
        if not iata_code:
            return ""
        
        airport = self.airports.get(iata_code.upper())
        if airport and 'city' in airport:
            return airport['city']
        
        return iata_code

    def get_iata_codes_by_city(self, city_name: str) -> list[str]:
        """Get list of IATA codes for a city name."""
        if not city_name:
            return []
        return self.city_map.get(city_name.lower(), [])

    def get_coordinates(self, iata_code: str) -> Optional[tuple[float, float]]:
        """Get (lat, lon) for an airport."""
        if not iata_code:
            return None
        airport = self.airports.get(iata_code.upper())
        if airport:
            return (float(airport['lat']), float(airport['lon']))
        return None

    def get_country_code(self, iata_code: str) -> str:
        """Get ISO country code for an airport."""
        if not iata_code:
            return ""
        airport = self.airports.get(iata_code.upper())
        if airport and 'country' in airport:
            return airport['country']
        return ""

    def calculate_distance(self, origin_code: str, dest_code: str) -> int:
        """
        Calculate distance between two airports in km using Haversine formula.
        Returns 0 if coordinates are missing.
        """
        import math

        coords1 = self.get_coordinates(origin_code)
        coords2 = self.get_coordinates(dest_code)

        if not coords1 or not coords2:
            return 0

        lat1, lon1 = coords1
        lat2, lon2 = coords2

        R = 6371  # Earth radius in km

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        d = R * c

        return int(round(d))

# Global instance
airport_service = AirportService()
