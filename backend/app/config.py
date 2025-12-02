from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    host: str = "0.0.0.0"
    port: int = 8000
    data_path: str = "../scraper/european_flight_data_enriched.csv"
    reload: bool = False
    geocode_cache_path: str = "geocode_cache.json"
    amadeus_api_key: str = "toos4wWIsRBA8LveqkVfOG1hThWSe7cl"
    amadeus_api_secret: str = "Fy2IcYxV3KhBWSLV"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False
    )


settings = Settings()
