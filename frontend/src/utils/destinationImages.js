/**
 * Dynamic destination images — fetches famous landmark/tourism photos.
 * Strategy: Wikipedia "Tourism in {city}" → Wikimedia Commons search → gradient fallback.
 * All results cached in localStorage for 7 days.
 */

const CACHE_KEY = 'destination_image_cache_v2';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Map of destinations to their famous landmark/attraction for better image results
const LANDMARK_QUERIES = {
    'visakhapatnam': 'Kailasagiri Visakhapatnam',
    'vizag': 'Kailasagiri Visakhapatnam',
    'hyderabad': 'Charminar Hyderabad',
    'mumbai': 'Gateway of India Mumbai',
    'delhi': 'India Gate New Delhi',
    'new delhi': 'India Gate New Delhi',
    'bangalore': 'Vidhana Soudha Bangalore',
    'bengaluru': 'Vidhana Soudha Bangalore',
    'chennai': 'Marina Beach Chennai',
    'kolkata': 'Victoria Memorial Kolkata',
    'jaipur': 'Hawa Mahal Jaipur',
    'goa': 'Baga Beach Goa',
    'agra': 'Taj Mahal',
    'varanasi': 'Varanasi Ghats',
    'udaipur': 'Lake Palace Udaipur',
    'pune': 'Shaniwar Wada Pune',
    'kerala': 'Kerala backwaters',
    'manali': 'Solang Valley Manali',
    'shimla': 'The Ridge Shimla',
    'darjeeling': 'Tiger Hill Darjeeling',
    'araku': 'Araku Valley',
    'mysore': 'Mysore Palace',
    'srinagar': 'Dal Lake Srinagar',
    'rishikesh': 'Lakshman Jhula Rishikesh',
    'pondicherry': 'Promenade Beach Pondicherry',
    'ooty': 'Ooty Lake',
    'paris': 'Eiffel Tower Paris',
    'london': 'Tower Bridge London',
    'tokyo': 'Tokyo Tower',
    'new york': 'Statue of Liberty',
    'dubai': 'Burj Khalifa Dubai',
    'singapore': 'Marina Bay Sands Singapore',
    'bali': 'Tanah Lot Bali',
    'rome': 'Colosseum Rome',
    'sydney': 'Sydney Opera House',
    'maldives': 'Maldives beach resort',
    'bangkok': 'Wat Arun Bangkok',
    'barcelona': 'Sagrada Familia Barcelona',
    'amsterdam': 'Amsterdam canals',
    'istanbul': 'Hagia Sophia Istanbul',
    'cairo': 'Great Pyramid of Giza',
    'venice': 'Grand Canal Venice',
    'kyoto': 'Fushimi Inari Kyoto',
    'prague': 'Charles Bridge Prague',
    'seoul': 'Gyeongbokgung Palace Seoul',
    'lisbon': 'Belem Tower Lisbon',
    'hong kong': 'Victoria Harbour Hong Kong',
    'kuala lumpur': 'Petronas Towers',
    'moscow': 'Saint Basil Cathedral Moscow',
    'san francisco': 'Golden Gate Bridge',
    'machu picchu': 'Machu Picchu',
    'los angeles': 'Hollywood Sign',
    'athens': 'Acropolis Athens',
    'berlin': 'Brandenburg Gate Berlin',
    'vienna': 'Schonbrunn Palace Vienna',
    'zurich': 'Lake Zurich',
    'lucknow': 'Bara Imambara Lucknow',
    'ahmedabad': 'Sabarmati Ashram',
    'jodhpur': 'Mehrangarh Fort Jodhpur',
    'amritsar': 'Golden Temple Amritsar',
    'tirupati': 'Tirumala Venkateswara Temple',
    'hampi': 'Hampi ruins',
    'coorg': 'Abbey Falls Coorg',
    'munnar': 'Munnar tea plantations',
    'kodaikanal': 'Kodaikanal lake',
    'leh': 'Pangong Lake Ladakh',
    'andaman': 'Radhanagar Beach Andaman',
};

function getCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const cleaned = {};
        for (const [key, entry] of Object.entries(parsed)) {
            if (now - entry.ts < CACHE_TTL) {
                cleaned[key] = entry;
            }
        }
        return cleaned;
    } catch {
        return {};
    }
}

function setCache(key, url) {
    try {
        const cache = getCache();
        cache[key] = { url, ts: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { /* quota exceeded */ }
}

/**
 * Search Wikimedia Commons for tourism/landmark images of a destination.
 */
async function fetchFromWikimediaCommons(query) {
    try {
        const params = new URLSearchParams({
            action: 'query',
            generator: 'search',
            gsrsearch: `${query} landmark tourism`,
            gsrlimit: '5',
            prop: 'imageinfo',
            iiprop: 'url|size',
            iiurlwidth: '800',
            format: 'json',
            origin: '*',
        });
        const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
        if (!res.ok) return null;
        const data = await res.json();

        if (!data.query?.pages) return null;

        // Find first image that's landscape-oriented and large enough
        const pages = Object.values(data.query.pages);
        for (const page of pages) {
            const info = page.imageinfo?.[0];
            if (info && info.width >= 600 && info.width > info.height) {
                return info.thumburl || info.url;
            }
        }
        // Fallback: return any image
        const first = pages[0]?.imageinfo?.[0];
        return first?.thumburl || first?.url || null;
    } catch {
        return null;
    }
}

/**
 * Fetch image from Wikipedia article summary.
 */
async function fetchFromWikipedia(query) {
    try {
        const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.originalimage?.source || data.thumbnail?.source || null;
    } catch {
        return null;
    }
}

// Gradient colors for fallback
const GRADIENT_COLORS = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#0575E6', '#021B79'],
    ['#e0c3fc', '#8ec5fc'],
];

export function getFallbackImage(destination) {
    const name = destination || 'Travel';
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
    const initial = name.charAt(0).toUpperCase();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${colors[0]}" />
                <stop offset="100%" style="stop-color:${colors[1]}" />
            </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#g)" />
        <text x="400" y="280" font-family="sans-serif" font-size="120" font-weight="bold" fill="rgba(255,255,255,0.25)" text-anchor="middle" dominant-baseline="central">${initial}</text>
        <text x="400" y="380" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.5)" text-anchor="middle">${name}</text>
    </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Load destination image dynamically.
 * Strategy:
 *   1. Check cache
 *   2. If landmark is known, fetch Wikipedia article for the landmark
 *   3. Try "Tourism in {destination}" Wikipedia page
 *   4. Search Wikimedia Commons for landmark/tourism photos
 *   5. Fall back to gradient placeholder
 */
export async function loadDestinationImage(destination, setUrl) {
    if (!destination) return;

    const key = destination.toLowerCase().trim();

    // 1. Check cache
    const cache = getCache();
    if (cache[key]?.url) {
        setUrl(cache[key].url);
        return;
    }

    // 2. Check if we know a famous landmark for this destination
    const landmarkQuery = LANDMARK_QUERIES[key];

    if (landmarkQuery) {
        const url = await fetchFromWikipedia(landmarkQuery);
        if (url) {
            setCache(key, url);
            setUrl(url);
            return;
        }
    }

    // 3. Try "Tourism in {destination}"
    const tourismUrl = await fetchFromWikipedia(`Tourism in ${destination}`);
    if (tourismUrl) {
        setCache(key, tourismUrl);
        setUrl(tourismUrl);
        return;
    }

    // 4. Search Wikimedia Commons
    const commonsUrl = await fetchFromWikimediaCommons(destination);
    if (commonsUrl) {
        setCache(key, commonsUrl);
        setUrl(commonsUrl);
        return;
    }

    // 5. Try plain destination on Wikipedia
    const plainUrl = await fetchFromWikipedia(destination);
    if (plainUrl) {
        setCache(key, plainUrl);
        setUrl(plainUrl);
        return;
    }

    // Gradient fallback remains
}
