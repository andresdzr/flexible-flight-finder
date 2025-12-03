import { useState, useRef, useEffect } from "react";
import { Plane } from "lucide-react";

const EUROPEAN_CITIES = [
  "Amsterdam",
  "Athens",
  "Barcelona",
  "Bergamo",
  "Berlin",
  "Bratislava",
  "Brussels",
  "Bucharest",
  "Budapest",
  "Copenhagen",
  "Dublin",
  "Edinburgh",
  "Frankfurt",
  "Geneva",
  "Hamburg",
  "Helsinki",
  "Istanbul",
  "Krakow",
  "Lisbon",
  "Ljubljana",
  "London",
  "Lyon",
  "Madrid",
  "Manchester",
  "Milan",
  "Munich",
  "Naples",
  "Nice",
  "Oslo",
  "Paris",
  "Prague",
  "Riga",
  "Rome",
  "Sofia",
  "Stockholm",
  "Tallinn",
  "Vienna",
  "Vilnius",
  "Warsaw",
  "Zurich",
].sort();

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "City or Airport",
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (inputValue.trim() === "") {
      setFilteredCities([]);
      setIsOpen(false);
    } else {
      const filtered = EUROPEAN_CITIES.filter((city) =>
        city.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredCities(filtered);
      setIsOpen(filtered.length > 0);
    }
  };

  const handleSelectCity = (city: string) => {
    onChange(city);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (value.trim() !== "") {
            const filtered = EUROPEAN_CITIES.filter((city) =>
              city.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCities(filtered);
            setIsOpen(filtered.length > 0);
          }
        }}
        className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.map((city) => (
            <button
              key={city}
              onClick={() => handleSelectCity(city)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-900 dark:text-gray-100"
            >
              <Plane className="w-4 h-4 text-blue-500" />
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
