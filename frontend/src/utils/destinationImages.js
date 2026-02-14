/**
 * Dynamic destination / attraction images.
 *
 * Strategy (most → least specific):
 *   1. localStorage cache (7-day TTL)
 *   2. Known LANDMARK_QUERIES → Wikipedia article image
 *   3. Wikipedia article for the attraction name alone
 *   4. Wikipedia opensearch → find best-matching article → image
 *   5. Wikimedia Commons file search
 *   6. Wikimedia Commons category search
 *   7. Gradient placeholder (final fallback — always works)
 */

const CACHE_KEY = 'destination_image_cache_v3';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Map of destinations to their famous landmark/attraction for better image results
const LANDMARK_QUERIES = {
    'visakhapatnam': 'Kailasagiri Visakhapatnam',
    'vizag': 'Kailasagiri Visakhapatnam',
    'hyderabad': 'Charminar Hyderabad',
    'mumbai': 'Gateway of India Mumbai',
    'delhi': 'India Gate New Delhi',
    'new delhi': 'India Gate New Delhi',
    'chennai': 'Marina Beach Chennai',
    'bangalore': 'Vidhana Soudha',
    'bengaluru': 'Vidhana Soudha',
    'kolkata': 'Victoria Memorial Kolkata',
    'jaipur': 'Hawa Mahal',
    'agra': 'Taj Mahal',
    'varanasi': 'Varanasi Ghats',
    'goa': 'Baga Beach Goa',
    'udaipur': 'Lake Palace Udaipur',
    'mysore': 'Mysore Palace',
    'mysuru': 'Mysore Palace',
    'pondicherry': 'Promenade Beach Pondicherry',
    'amritsar': 'Golden Temple',
    'darjeeling': 'Darjeeling tea garden',
    'shimla': 'Ridge Shimla',
    'manali': 'Solang Valley',
    'leh': 'Pangong Lake',
    'ladakh': 'Pangong Lake',
    'rishikesh': 'Lakshman Jhula',
    'tirupati': 'Tirumala Venkateswara Temple',
    'hampi': 'Virupaksha Temple Hampi',
    'ooty': 'Ooty Lake',
    'kodaikanal': 'Kodaikanal Lake',
    'munnar': 'Munnar tea gardens',
    'alleppey': 'Kerala houseboat',
    'kochi': 'Chinese fishing nets Kochi',
    'paris': 'Eiffel Tower',
    'london': 'Big Ben London',
    'new york': 'Statue of Liberty',
    'new york city': 'Statue of Liberty',
    'tokyo': 'Shibuya Crossing',
    'dubai': 'Burj Khalifa',
    'singapore': 'Marina Bay Sands',
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
    'lisbon': 'Belém Tower Lisbon',
    'vienna': 'Schönbrunn Palace',
    'berlin': 'Brandenburg Gate',
    'athens': 'Parthenon Athens',
    'moscow': 'Saint Basil Cathedral',
    'petra': 'Al-Khazneh Petra',
    'machu picchu': 'Machu Picchu',
    'angkor wat': 'Angkor Wat',
    'great wall': 'Great Wall of China',
    'toronto': 'CN Tower Toronto',
    'vancouver': 'Stanley Park Vancouver',
    'santorini': 'Santorini Greece',
    'mykonos': 'Mykonos Greece',
    'phuket': 'Phi Phi Islands',
    'hanoi': 'Ha Long Bay',
    'ho chi minh': 'Ho Chi Minh City',
    'marrakech': 'Jemaa el-Fnaa Marrakech',
    'cape town': 'Table Mountain Cape Town',
    'nairobi': 'Nairobi National Park',
    'rio de janeiro': 'Christ the Redeemer Rio',
    'buenos aires': 'La Boca Buenos Aires',
    'cusco': 'Machu Picchu',
    'queenstown': 'Milford Sound',
    'banff': 'Lake Louise',
    'kerala': 'Kerala backwaters',
    'araku valley': 'Borra Caves',
    'cartagena': 'Cartagena Colombia',
    'zanzibar': 'Zanzibar beach',
    'kathmandu': 'Swayambhunath Kathmandu',
    'colombo': 'Colombo Sri Lanka',
    'dhaka': 'Lalbagh Fort Dhaka',
    'beijing': 'Great Wall of China',
    'shanghai': 'Shanghai skyline',
    'chiang mai': 'Doi Suthep Chiang Mai',
};

// ─── Cache helpers ─────────────────────────────────────────────────
function getCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const cleaned = {};
        for (const [key, entry] of Object.entries(parsed)) {
            if (now - entry.ts < CACHE_TTL) cleaned[key] = entry;
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

// ─── Wikipedia REST API: article summary → image ───────────────────
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

// ─── Wikipedia opensearch: find the closest article title ──────────
async function findWikipediaTitle(query) {
    try {
        const params = new URLSearchParams({
            action: 'opensearch',
            search: query,
            limit: '5',
            format: 'json',
            origin: '*',
        });
        const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data[1] || [];
    } catch {
        return [];
    }
}

// ─── Wikimedia Commons: search for images ──────────────────────────
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

// ─── Gradient placeholder (always works) ───────────────────────────
const GRADIENT_COLORS = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#0575E6', '#021B79'],
    ['#e0c3fc', '#8ec5fc'],
    ['#FF6B6B', '#ee5a24'],
    ['#10ac84', '#1dd1a1'],
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


// ─── MAIN: load image with aggressive multi-strategy approach ──────
/**
 * Load an image for any attraction, cuisine, or destination.
 *
 * @param {string} query   – e.g. "Hawa Mahal", "Dal Baati Churma food dish"
 * @param {function} setUrl – React state setter
 */
export async function loadDestinationImage(query, setUrl) {
    if (!query) return;

    const key = query.toLowerCase().trim();

    // 1. Check cache
    const cache = getCache();
    if (cache[key]?.url) {
        setUrl(cache[key].url);
        return;
    }

    // 2. Check if we have a known landmark mapping
    const landmarkQuery = LANDMARK_QUERIES[key];
    if (landmarkQuery) {
        const url = await fetchFromWikipedia(landmarkQuery);
        if (url) {
            setCache(key, url);
            setUrl(url);
            return;
        }
    }

    // 3. Try the query directly on Wikipedia
    const directUrl = await fetchFromWikipedia(query);
    if (directUrl) {
        setCache(key, directUrl);
        setUrl(directUrl);
        return;
    }

    // 4. Extract just the first meaningful part (before " food", " dish", etc.)
    const cleanedQuery = query
        .replace(/\s+(food|dish|cuisine|meal|drink|dessert|sweet|snack)\b/gi, '')
        .trim();
    if (cleanedQuery !== query) {
        const cleanUrl = await fetchFromWikipedia(cleanedQuery);
        if (cleanUrl) {
            setCache(key, cleanUrl);
            setUrl(cleanUrl);
            return;
        }
    }

    // 5. Use Wikipedia opensearch to find the closest article title
    const titles = await findWikipediaTitle(cleanedQuery || query);
    for (const title of titles) {
        const url = await fetchFromWikipedia(title);
        if (url) {
            setCache(key, url);
            setUrl(url);
            return;
        }
    }

    // 6. Try "Tourism in {query}" on Wikipedia
    const tourismUrl = await fetchFromWikipedia(`Tourism in ${cleanedQuery || query}`);
    if (tourismUrl) {
        setCache(key, tourismUrl);
        setUrl(tourismUrl);
        return;
    }

    // 7. Search Wikimedia Commons
    const commonsUrl = await fetchFromWikimediaCommons(cleanedQuery || query);
    if (commonsUrl) {
        setCache(key, commonsUrl);
        setUrl(commonsUrl);
        return;
    }

    // 8. Fallback: gradient remains (no broken external URL)
}
