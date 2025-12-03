import httpx
from datetime import datetime, timedelta
from app.config import settings
from fastapi import HTTPException


class AmadeusClient:
    def __init__(self):
        self.base_url = "https://test.api.amadeus.com"
        self.client_id = settings.amadeus_api_key
        self.client_secret = settings.amadeus_api_secret
        self.token = None
        self.token_expiry = None

    async def authenticate(self):
        """Authenticate with Amadeus API to get access token."""
        if self.token and self.token_expiry and datetime.now() < self.token_expiry:
            return

        url = f"{self.base_url}/v1/security/oauth2/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, data=data)
                response.raise_for_status()
                token_data = response.json()
                self.token = token_data["access_token"]
                # Set expiry slightly before actual expiry to be safe
                self.token_expiry = datetime.now() + timedelta(
                    seconds=token_data["expires_in"] - 60
                )
            except httpx.HTTPError as e:
                print(f"Authentication failed: {e}")
                # For now, if auth fails (e.g. empty keys), we might want to handle it gracefully or let it fail
                # But since user said "leave empty for now", we should probably expect this to fail if we try to use it without keys.
                pass

    async def search_flight_destinations(
        self,
        origin,
        departure_date_range,
        one_way,
        duration=None,
        non_stop=False,
        max_price=None,
    ):
        """
        Call Flight Inspiration Search API (flight-destinations).
        """
        await self.authenticate()

        if not self.token:
            # If no token (e.g. missing credentials), return empty list or raise error
            # For this task, we'll return None to signal fallback to mock data or empty
            return None

        url = f"{self.base_url}/v1/shopping/flight-destinations"

        params = {
            "origin": origin,
            "departureDate": departure_date_range,
            "oneWay": str(one_way).lower(),
            "nonStop": str(non_stop).lower(),
        }

        if duration:
            params["duration"] = duration

        if max_price:
            params["maxPrice"] = int(max_price)

        headers = {"Authorization": f"Bearer {self.token}"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Amadeus API request failed: {e}")
                return None


amadeus_client = AmadeusClient()
