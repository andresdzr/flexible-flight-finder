# Flight Scraper

This directory contains scripts to scrape flight prices from Google Flights using Selenium.

## Prerequisites

- Python 3.x
- Chrome Browser installed
- ChromeDriver (compatible with your Chrome version)

## Installation

1.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

### Google Flight Scraper

The main scraper script is `google_flight_scraper.py`. It scrapes flight prices for a predefined list of European cities.

**Command:**

```bash
python google_flight_scraper.py <months> <output_file>
```

**Arguments:**

-   `months`: Number of months to scrape ahead (integer).
-   `output_file`: Path to the CSV file where data will be saved.

**Example:**

```bash
python google_flight_scraper.py 6 data/flight_prices.csv
```

This will scrape flight prices for the next 6 months for all city pairs defined in the script and save the results to `data/flight_prices.csv`.

## Data Processing

`google_flight_process.py` (if applicable) likely contains logic to process or clean the scraped data. Check the file content for specific usage if needed.

## Notes

-   The scraper runs in headless mode by default.
-   It uses `selenium-stealth` to avoid detection.
-   The list of cities is hardcoded in `google_flight_scraper.py`. You can modify the `CITIES` list in the script to add or remove destinations.
