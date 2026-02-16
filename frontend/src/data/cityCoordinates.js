/**
 * City Coordinates — Single source of truth for offline geocoding.
 *
 * Merged from KNOWN_CITIES (tripOrchestrator) and GEOCODE_CITIES (transportEngine).
 * Used for instant (no-network) coordinate lookups before falling back to Nominatim.
 *
 * @module data/cityCoordinates
 */

// Canonical format: { lat, lng } — compact internal representation
const CITY_COORDINATES = {
    // India
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'new delhi': { lat: 28.6139, lng: 77.2090 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'bengaluru': { lat: 12.9716, lng: 77.5946 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'goa': { lat: 15.2993, lng: 74.1240 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'agra': { lat: 27.1767, lng: 78.0081 },
    'varanasi': { lat: 25.3176, lng: 82.9739 },
    'udaipur': { lat: 24.5854, lng: 73.7125 },
    'shimla': { lat: 31.1048, lng: 77.1734 },
    'manali': { lat: 32.2396, lng: 77.1887 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'coorg': { lat: 12.3375, lng: 75.8069 },
    'mysore': { lat: 12.2958, lng: 76.6394 },
    'mysuru': { lat: 12.2958, lng: 76.6394 },
    'kochi': { lat: 9.9312, lng: 76.2673 },
    'kerala': { lat: 10.8505, lng: 76.2711 },
    'rishikesh': { lat: 30.0869, lng: 78.2676 },
    'pondicherry': { lat: 11.9416, lng: 79.8083 },
    'ooty': { lat: 11.4102, lng: 76.6950 },
    'darjeeling': { lat: 27.0410, lng: 88.2663 },
    'leh': { lat: 34.1526, lng: 77.5771 },
    'ladakh': { lat: 34.1526, lng: 77.5771 },
    'kashmir': { lat: 34.0837, lng: 74.7973 },
    'amritsar': { lat: 31.6340, lng: 74.8723 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'surat': { lat: 21.1702, lng: 72.8311 },
    'indore': { lat: 22.7196, lng: 75.8577 },
    'bhopal': { lat: 23.2599, lng: 77.4126 },
    'nagpur': { lat: 21.1458, lng: 79.0882 },
    'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'vizag': { lat: 17.6868, lng: 83.2185 },

    // Asia
    'tokyo': { lat: 35.6762, lng: 139.6503 },
    'dubai': { lat: 25.2048, lng: 55.2708 },
    'bangkok': { lat: 13.7563, lng: 100.5018 },
    'singapore': { lat: 1.3521, lng: 103.8198 },
    'bali': { lat: -8.3405, lng: 115.0920 },
    'seoul': { lat: 37.5665, lng: 126.9780 },
    'kuala lumpur': { lat: 3.1390, lng: 101.6869 },
    'hong kong': { lat: 22.3193, lng: 114.1694 },

    // Europe
    'paris': { lat: 48.8566, lng: 2.3522 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'rome': { lat: 41.9028, lng: 12.4964 },
    'barcelona': { lat: 41.3874, lng: 2.1686 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 },
    'istanbul': { lat: 41.0082, lng: 28.9784 },
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'vienna': { lat: 48.2082, lng: 16.3738 },
    'prague': { lat: 50.0755, lng: 14.4378 },
    'lisbon': { lat: 38.7223, lng: -9.1393 },
    'athens': { lat: 37.9838, lng: 23.7275 },
    'zurich': { lat: 47.3769, lng: 8.5417 },

    // Americas
    'new york': { lat: 40.7128, lng: -74.0060 },
    'san francisco': { lat: 37.7749, lng: -122.4194 },
    'los angeles': { lat: 34.0522, lng: -118.2437 },
    'vancouver': { lat: 49.2827, lng: -123.1207 },
    'toronto': { lat: 43.6532, lng: -79.3832 },
    'miami': { lat: 25.7617, lng: -80.1918 },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729 },

    // Africa & Oceania
    'cairo': { lat: 30.0444, lng: 31.2357 },
    'cape town': { lat: -33.9249, lng: 18.4241 },
    'sydney': { lat: -33.8688, lng: 151.2093 },
    'hawaii': { lat: 19.8968, lng: -155.5828 },
    'maldives': { lat: 3.2028, lng: 73.2207 },
};

/**
 * Get coordinates in { lat, lng } format (used by transportEngine).
 * Supports exact and partial city name matching.
 */
export function getCityCoords(location) {
    if (!location) return null;
    const norm = location.toLowerCase().trim();
    if (CITY_COORDINATES[norm]) return CITY_COORDINATES[norm];
    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
        if (norm.includes(city) || city.includes(norm)) return coords;
    }
    return null;
}

/**
 * Get coordinates in { latitude, longitude } format (used by tripOrchestrator/segments).
 * Supports exact and partial city name matching.
 */
export function getCityCoordsLong(location) {
    const coords = getCityCoords(location);
    if (!coords) return null;
    return { latitude: coords.lat, longitude: coords.lng };
}

/** Raw city data for iteration (e.g., partial matching in engines) */
export { CITY_COORDINATES };
