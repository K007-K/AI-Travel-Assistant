/**
 * Maps a destination/city/country to its local currency code.
 * Used to auto-select the correct currency based on trip location.
 */

// Country → currency mappings
const COUNTRY_CURRENCY = {
    'india': 'INR',
    'united states': 'USD', 'usa': 'USD', 'america': 'USD',
    'united kingdom': 'GBP', 'uk': 'GBP', 'england': 'GBP', 'scotland': 'GBP', 'wales': 'GBP',
    'france': 'EUR', 'germany': 'EUR', 'italy': 'EUR', 'spain': 'EUR', 'portugal': 'EUR',
    'netherlands': 'EUR', 'belgium': 'EUR', 'austria': 'EUR', 'greece': 'EUR', 'ireland': 'EUR',
    'finland': 'EUR', 'croatia': 'EUR', 'malta': 'EUR', 'cyprus': 'EUR', 'slovenia': 'EUR',
    'slovakia': 'EUR', 'estonia': 'EUR', 'latvia': 'EUR', 'lithuania': 'EUR', 'luxembourg': 'EUR',
    'japan': 'JPY',
    'australia': 'AUD',
    'canada': 'CAD',
    'china': 'CNY',
    'south korea': 'KRW', 'korea': 'KRW',
    'thailand': 'THB',
    'indonesia': 'IDR',
    'malaysia': 'MYR',
    'singapore': 'SGD',
    'philippines': 'PHP',
    'vietnam': 'VND',
    'turkey': 'TRY', 'türkiye': 'TRY',
    'uae': 'AED', 'united arab emirates': 'AED',
    'saudi arabia': 'SAR',
    'egypt': 'EGP',
    'south africa': 'ZAR',
    'brazil': 'BRL',
    'mexico': 'MXN',
    'russia': 'RUB',
    'sweden': 'SEK',
    'norway': 'NOK',
    'denmark': 'DKK',
    'switzerland': 'CHF',
    'new zealand': 'NZD',
    'sri lanka': 'LKR',
    'nepal': 'NPR',
    'bangladesh': 'BDT',
    'pakistan': 'PKR',
    'maldives': 'MVR',
    'morocco': 'MAD',
    'kenya': 'KES',
    'tanzania': 'TZS',
    'peru': 'PEN',
    'argentina': 'ARS',
    'colombia': 'COP',
    'chile': 'CLP',
    'czech republic': 'CZK', 'czechia': 'CZK',
    'hungary': 'HUF',
    'poland': 'PLN',
    'romania': 'RON',
    'israel': 'ILS',
    'jordan': 'JOD',
    'qatar': 'QAR',
    'oman': 'OMR',
    'bahrain': 'BHD',
    'kuwait': 'KWD',
    'cambodia': 'KHR',
    'myanmar': 'MMK',
    'laos': 'LAK',
    'taiwan': 'TWD',
    'hong kong': 'HKD',
};

// City → currency (for cities where the country name isn't obvious)
const CITY_CURRENCY = {
    // India
    'mumbai': 'INR', 'delhi': 'INR', 'new delhi': 'INR', 'bangalore': 'INR', 'bengaluru': 'INR',
    'hyderabad': 'INR', 'chennai': 'INR', 'kolkata': 'INR', 'pune': 'INR', 'jaipur': 'INR',
    'goa': 'INR', 'agra': 'INR', 'varanasi': 'INR', 'udaipur': 'INR', 'shimla': 'INR',
    'manali': 'INR', 'darjeeling': 'INR', 'rishikesh': 'INR', 'mysore': 'INR', 'lucknow': 'INR',
    'ahmedabad': 'INR', 'srinagar': 'INR', 'leh': 'INR', 'ladakh': 'INR', 'pondicherry': 'INR',
    'ooty': 'INR', 'munnar': 'INR', 'kerala': 'INR', 'kodaikanal': 'INR', 'coorg': 'INR',
    'andaman': 'INR', 'tirupati': 'INR', 'hampi': 'INR', 'jodhpur': 'INR', 'amritsar': 'INR',
    'visakhapatnam': 'INR', 'vizag': 'INR', 'araku': 'INR',
    'kochi': 'INR', 'thiruvananthapuram': 'INR', 'coimbatore': 'INR', 'madurai': 'INR',
    'bhopal': 'INR', 'indore': 'INR', 'chandigarh': 'INR', 'dehradun': 'INR',
    'guwahati': 'INR', 'patna': 'INR', 'ranchi': 'INR', 'bhubaneswar': 'INR',

    // Europe
    'paris': 'EUR', 'london': 'GBP', 'rome': 'EUR', 'barcelona': 'EUR', 'madrid': 'EUR',
    'amsterdam': 'EUR', 'berlin': 'EUR', 'munich': 'EUR', 'vienna': 'EUR', 'athens': 'EUR',
    'lisbon': 'EUR', 'venice': 'EUR', 'florence': 'EUR', 'milan': 'EUR', 'dublin': 'EUR',
    'brussels': 'EUR', 'helsinki': 'EUR', 'prague': 'CZK', 'budapest': 'HUF',
    'warsaw': 'PLN', 'zurich': 'CHF', 'geneva': 'CHF', 'stockholm': 'SEK',
    'oslo': 'NOK', 'copenhagen': 'DKK', 'edinburgh': 'GBP', 'manchester': 'GBP',
    'santorini': 'EUR', 'mykonos': 'EUR', 'crete': 'EUR',
    'istanbul': 'TRY', 'moscow': 'RUB', 'st petersburg': 'RUB',

    // Asia
    'tokyo': 'JPY', 'osaka': 'JPY', 'kyoto': 'JPY',
    'beijing': 'CNY', 'shanghai': 'CNY',
    'seoul': 'KRW', 'busan': 'KRW',
    'bangkok': 'THB', 'phuket': 'THB', 'chiang mai': 'THB',
    'bali': 'IDR', 'jakarta': 'IDR',
    'kuala lumpur': 'MYR',
    'singapore': 'SGD',
    'manila': 'PHP',
    'hanoi': 'VND', 'ho chi minh': 'VND',
    'hong kong': 'HKD',
    'taipei': 'TWD',
    'colombo': 'LKR',
    'kathmandu': 'NPR',
    'dhaka': 'BDT',

    // Middle East
    'dubai': 'AED', 'abu dhabi': 'AED',
    'riyadh': 'SAR', 'jeddah': 'SAR',
    'doha': 'QAR',
    'cairo': 'EGP',
    'tel aviv': 'ILS', 'jerusalem': 'ILS',
    'amman': 'JOD',
    'muscat': 'OMR',
    'manama': 'BHD',

    // Americas
    'new york': 'USD', 'los angeles': 'USD', 'san francisco': 'USD', 'las vegas': 'USD',
    'miami': 'USD', 'chicago': 'USD', 'washington': 'USD', 'boston': 'USD', 'seattle': 'USD',
    'hawaii': 'USD', 'honolulu': 'USD',
    'toronto': 'CAD', 'vancouver': 'CAD', 'montreal': 'CAD',
    'cancun': 'MXN', 'mexico city': 'MXN',
    'rio de janeiro': 'BRL', 'sao paulo': 'BRL',
    'buenos aires': 'ARS',
    'lima': 'PEN',
    'bogota': 'COP',
    'santiago': 'CLP',
    'machu picchu': 'PEN',

    // Oceania
    'sydney': 'AUD', 'melbourne': 'AUD', 'brisbane': 'AUD', 'perth': 'AUD',
    'auckland': 'NZD', 'queenstown': 'NZD',

    // Africa
    'cape town': 'ZAR', 'johannesburg': 'ZAR',
    'nairobi': 'KES',
    'marrakech': 'MAD',
    'zanzibar': 'TZS',
    'maldives': 'MVR',
};

/**
 * Get the local currency code for a given destination.
 * @param {string} destination - City, region, or country name
 * @returns {string} Currency code (e.g., 'INR', 'EUR', 'USD')
 */
export function getCurrencyForDestination(destination) {
    if (!destination) return 'USD';

    const key = destination.toLowerCase().trim();

    // 1. Exact city match
    if (CITY_CURRENCY[key]) return CITY_CURRENCY[key];

    // 2. Check if destination contains a known city name
    for (const [city, currency] of Object.entries(CITY_CURRENCY)) {
        if (key.includes(city) || city.includes(key)) return currency;
    }

    // 3. Check country match (for entries like "India", "France")
    if (COUNTRY_CURRENCY[key]) return COUNTRY_CURRENCY[key];

    // 4. Check if destination contains country name
    for (const [country, currency] of Object.entries(COUNTRY_CURRENCY)) {
        if (key.includes(country)) return currency;
    }

    // 5. Default
    return 'USD';
}

/**
 * Get a display-friendly currency symbol.
 */
export function getCurrencySymbol(code) {
    const symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CNY': '¥',
        'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'KRW': '₩', 'THB': '฿',
        'SGD': 'S$', 'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱', 'VND': '₫',
        'TRY': '₺', 'AED': 'د.إ', 'SAR': '﷼', 'EGP': 'E£', 'ZAR': 'R',
        'BRL': 'R$', 'MXN': 'Mex$', 'RUB': '₽', 'SEK': 'kr', 'NOK': 'kr',
        'DKK': 'kr', 'NZD': 'NZ$', 'HKD': 'HK$', 'TWD': 'NT$',
        'CZK': 'Kč', 'HUF': 'Ft', 'PLN': 'zł',
        'LKR': 'Rs', 'NPR': 'Rs', 'BDT': '৳', 'PKR': 'Rs',
    };
    return symbols[code] || code;
}
