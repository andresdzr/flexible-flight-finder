import time
import os
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium_stealth import stealth
import argparse

# Top 25 Cities (Names must match what Google Flights Autocomplete expects/shows)
CITIES = [
    "Madrid",
    "London",
    "Paris",
    "Amsterdam",
    "Rome",
    "Berlin",
    "Vienna",
    "Lisbon",
    "Dublin",
    "Brussels",
    "Athens",
    "Prague",
    "Budapest",
    "Warsaw",
    "Copenhagen",
    "Stockholm",
    "Oslo",
    "Helsinki",
    "Bucharest",
    "Sofia",
    "Riga",
    "Vilnius",
    "Tallinn",
    "Ljubljana",
    "Bratislava",
    "Barcelona", 
    "Frankfurt", 
    "Milan", 
    "Istanbul",
    "Krakow", 
    "Zurich", 
    "Manchester",
    "Nice", 
    "Copenhagen", 
    "Oslo", 
]

def setup_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1920,1080")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    # Disable Images for (minimal) speedup
    prefs = {
        "profile.managed_default_content_settings.images": 2,
    }

    options.add_experimental_option("prefs", prefs)
    driver = webdriver.Chrome(options=options)

    # stealth driver against detection?
    stealth(
        driver,
        languages=["en-US", "en"],
        vendor="Google Inc.",
        platform="Win32",
        webgl_vendor="Intel Inc.",
        renderer="Intel Iris OpenGL Engine",
        fix_hairline=True,
    )
    return driver


def scrape_route(driver, origin, destination, months, output_file):
    print(f"\n✈️  Processing Route: {origin} -> {destination}")
    prices_map = {}

    try:
        # 1. Access Origin and Destination
        safe_origin = origin.replace(" ", "+")
        safe_dest = destination.replace(" ", "+")
        url = f"https://www.google.com/travel/flights?q=Flights+from+{safe_origin}+to+{safe_dest}+one+way"

        driver.get(url)

        # 2. Handle Cookies
        try:
            wait = WebDriverWait(driver, 2)
            cookie_btn = wait.until(
                EC.element_to_be_clickable(
                    (
                        By.XPATH,
                        "//button[contains(., 'Reject all') or contains(., 'Accept all') or contains(., 'Rechazar todo')]",
                    )
                )
            )
            cookie_btn.click()
        except Exception:
            pass

        # 3. Open Calendar
        try:
            date_input = wait.until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, "input[placeholder='Departure']")
                )
            )
            date_input.click()
            time.sleep(2)
        except Exception as e:
            print("   ⚠️ Could not open calendar.")
            return

        # 4. Scrape X Months
        for i in range(months):
            # Find visible grid cells
            day_cells = driver.find_elements(By.CSS_SELECTOR, "div[role='gridcell']")

            for cell in day_cells:
                try:
                    iso_date = cell.get_attribute("data-iso")
                    if not iso_date:
                        continue

                    price_text = cell.text.split("\n")
                    price_value = None

                    # Try finding price div first
                    try:
                        price_element = cell.find_element(
                            By.CSS_SELECTOR, "div[jsname='qCDwBb']"
                        )
                        price_value = price_element.text.strip()
                    except:
                        # Fallback text parsing
                        for line in price_text:
                            if (
                                "€" in line
                                or "$" in line
                                or "£" in line
                                or (line.isdigit() and int(line) > 31)
                            ):
                                price_value = line.strip()
                                break

                    if price_value:
                        clean_price = (
                            price_value.replace("€", "")
                            .replace("$", "")
                            .replace("£", "")
                            .replace(",", "")
                            .strip()
                        )
                        if clean_price.isdigit():
                            # Store the ORIGINAL price_value (with currency)
                            prices_map[iso_date] = price_value

                except Exception:
                    continue

            # Click Next
            if i < months - 1:
                try:
                    next_button = driver.find_element(
                        By.XPATH, "//button[contains(@aria-label, 'Next')]"
                    )
                    next_button.click()
                    time.sleep(1)
                except Exception:
                    break

        # 5. Append Data to CSV
        if prices_map:
            data_list = [
                {"Origin": origin, "Destination": destination, "Date": k, "Price": v}
                for k, v in prices_map.items()
            ]
            df = pd.DataFrame(data_list)
            df["Date"] = pd.to_datetime(df["Date"])
            df = df.sort_values(by="Date")

            # Check if file exists to determine if we need a header
            file_exists = os.path.isfile(output_file)
            df.to_csv(output_file, mode="a", header=not file_exists, index=False)
            print(f"   ✅ Saved {len(df)} prices for {origin}->{destination}")
        else:
            print(f"   ⚠️ No data found for {origin}->{destination}")

    except Exception as e:
        print(f"   ❌ Critical Error on route: {e}")


def main(months,output_file):
    driver = setup_driver()

    try:
        # Loop through all city pairs
        total_routes = len(CITIES) * (len(CITIES) - 1)
        count = 0

        for origin in CITIES:
            for destination in CITIES:
                if origin == destination:
                    continue

                count += 1
                print(f"--- Progress: {count}/{total_routes} ---")
                scrape_route(driver, origin, destination, months, output_file)

                # Small pause between routes to be polite :-)
                time.sleep(2)

    except KeyboardInterrupt:
        print("\n🛑 Scrape interrupted by user.")
    finally:
        print("🛑 Closing driver...")
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrapes Google Flights for flight prices between specified cities.")
    parser.add_argument("months", help="Months to scrape", type=str)
    parser.add_argument("output", help="The path where the enriched CSV file should be saved", type=str)
    args = parser.parse_args()
    
    main(args.months, args.output)
