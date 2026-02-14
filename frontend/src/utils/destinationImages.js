/**
 * Dynamic destination / attraction images.
 *
 * Strategy:
 *   1. localStorage cache (7-day TTL)
 *   2. Known ATTRACTION_IMAGES map → direct Wikipedia article → image
 *   3. Wikipedia REST API (page summary)
 *   4. MediaWiki pageimages API (more reliable for thumbnails)
 *   5. Wikipedia opensearch → find closest article
 *   6. Wikimedia Commons search
 *   7. Gradient fallback SVG (always works)
 */

const CACHE_KEY = 'destination_image_cache_v4';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Comprehensive map: attraction/cuisine name → Wikipedia article title ───
// This covers ALL curated destination highlights and cuisines for 100% reliability.
const ATTRACTION_IMAGES = {
    // ── Araku Valley (d1) ──
    'borra caves': 'Borra Caves',
    'padmapuram gardens': 'Padmapuram Gardens',
    'coffee plantations': 'Coffee production in India',
    'tribal museum': 'Araku Valley',
    'katiki waterfalls': 'Katiki Waterfalls',
    'bamboo chicken': 'Bamboo chicken',
    'araku coffee': 'Coffee production in India',
    'bongulo chicken': 'Bamboo chicken',

    // ── Visakhapatnam (d2) ──
    'kailasagiri': 'Kailasagiri',
    'rk beach': 'Ramakrishna Beach',
    'ins kursura submarine museum': 'INS Kursura (S20)',
    'yarada beach': 'Yarada Beach',
    'simhachalam temple': 'Simhachalam',
    'vizag fish curry': 'Fish curry',
    'punugulu': 'Punugulu',

    // ── Tirupati (d3) ──
    'tirumala temple': 'Tirumala Venkateswara Temple',
    'talakona waterfall': 'Talakona',
    'sri padmavathi temple': 'Sri Padmavathi Ammavari Temple',
    'chandragiri fort': 'Chandragiri Fort, Andhra Pradesh',
    'silathoranam': 'Silathoranam',
    'tirupati laddu': 'Tirupati laddu',
    'pulihora': 'Pulihora',
    'dosa varieties': 'Dosa',

    // ── New York City (d4) ──
    'statue of liberty': 'Statue of Liberty',
    'central park': 'Central Park',
    'times square': 'Times Square',
    'metropolitan museum of art': 'Metropolitan Museum of Art',
    'brooklyn bridge': 'Brooklyn Bridge',
    'new york pizza': 'New York-style pizza',
    'bagels': 'Bagel',
    'cheesecake': 'Cheesecake',

    // ── Banff (d5) ──
    'lake louise': 'Lake Louise, Alberta',
    'moraine lake': 'Moraine Lake',
    'banff gondola': 'Banff Gondola',
    'johnston canyon': 'Johnston Canyon',
    'icefields parkway': 'Icefields Parkway',
    'alberta beef': 'Alberta beef',
    'bison burger': 'Bison hunting',
    'poutine': 'Poutine',

    // ── Dubai (d6) ──
    'burj khalifa': 'Burj Khalifa',
    'dubai mall': 'Dubai Mall',
    'palm jumeirah': 'Palm Jumeirah',
    'dubai marina': 'Dubai Marina',
    'desert safari': 'Desert safari',
    'al machboos': 'Machboos',
    'shawarma': 'Shawarma',
    'luqaimat': 'Luqaimat',

    // ── Queenstown (d7) ──
    'milford sound': 'Milford Sound',
    'bungy at kawarau bridge': 'Kawarau Bridge',
    'skyline gondola': 'Skyline Queenstown',
    'glenorchy': 'Glenorchy, New Zealand',
    'shotover jet': 'Shotover Jet',
    'fergburger': 'Fergburger',
    'nz lamb': 'Lamb and mutton',
    'hokey pokey ice cream': 'Hokey pokey (ice cream)',

    // ── Mumbai (d8) ──
    'gateway of india': 'Gateway of India',
    'marine drive': 'Marine Drive, Mumbai',
    'elephanta caves': 'Elephanta Caves',
    'chhatrapati shivaji terminus': 'Chhatrapati Shivaji Maharaj Terminus',
    'dharavi': 'Dharavi',
    'vada pav': 'Vada pav',
    'pav bhaji': 'Pav bhaji',
    'bombay sandwich': 'Bombay sandwich',

    // ── Jaipur (d9) ──
    'hawa mahal': 'Hawa Mahal',
    'amer fort': 'Amer Fort',
    'city palace': 'City Palace, Jaipur',
    'jantar mantar': 'Jantar Mantar, Jaipur',
    'nahargarh fort': 'Nahargarh Fort',
    'dal baati churma': 'Dal Baati Churma',
    'laal maas': 'Laal maas',
    'ghewar': 'Ghewar',

    // ── Kerala (d10) ──
    'alleppey backwaters': 'Alappuzha',
    'munnar tea gardens': 'Munnar',
    'periyar wildlife sanctuary': 'Periyar National Park',
    'varkala beach': 'Varkala',
    'fort kochi': 'Fort Kochi',
    'malabar fish curry': 'Fish molee',
    'appam & stew': 'Appam',
    'kerala sadya': 'Sadya',

    // ── London (d11) ──
    'tower of london': 'Tower of London',
    'british museum': 'British Museum',
    'buckingham palace': 'Buckingham Palace',
    'london eye': 'London Eye',
    'westminster abbey': 'Westminster Abbey',
    'fish and chips': 'Fish and chips',
    'full english breakfast': 'Full breakfast',
    'afternoon tea': 'Tea (meal)',

    // ── Rome (d12) ──
    'colosseum': 'Colosseum',
    'vatican city': 'Vatican City',
    'trevi fountain': 'Trevi Fountain',
    'roman forum': 'Roman Forum',
    'pantheon': 'Pantheon, Rome',
    'cacio e pepe': 'Cacio e pepe',
    'supplì': 'Supplì',
    'gelato': 'Gelato',

    // ── Sydney (d13) ──
    'sydney opera house': 'Sydney Opera House',
    'harbour bridge': 'Sydney Harbour Bridge',
    'bondi beach': 'Bondi Beach',
    'taronga zoo': 'Taronga Zoo',
    'blue mountains': 'Blue Mountains (New South Wales)',
    'meat pie': 'Meat pie',
    'flat white': 'Flat white',
    'barramundi': 'Barramundi',

    // ── Santorini (d14) ──
    'oia sunset': 'Oia, Greece',
    'red beach': 'Red Beach (Santorini)',
    'ancient akrotiri': 'Akrotiri (prehistoric city)',
    'fira to oia hike': 'Santorini',
    'wine tasting': 'Santorini (wine)',
    'tomatokeftedes': 'Keftedes',
    'fava': 'Fava Santorinis',
    'fresh seafood': 'Greek cuisine',

    // ── Kyoto (d15) ──
    'fushimi inari shrine': 'Fushimi Inari-taisha',
    'kinkaku-ji (golden pavilion)': 'Kinkaku-ji',
    'arashiyama bamboo grove': 'Arashiyama',
    'kiyomizu-dera': 'Kiyomizu-dera',
    'geisha district (gion)': 'Gion',
    'kaiseki': 'Kaiseki',
    'matcha everything': 'Matcha',
    'yudofu (hot tofu)': 'Yudofu',
};

// Map of destination names → Wikipedia landmark articles (for hero images)
const LANDMARK_QUERIES = {
    'visakhapatnam': 'Kailasagiri',
    'vizag': 'Kailasagiri',
    'hyderabad': 'Charminar',
    'mumbai': 'Gateway of India',
    'delhi': 'India Gate',
    'new delhi': 'India Gate',
    'chennai': 'Marina Beach',
    'bangalore': 'Vidhana Soudha',
    'bengaluru': 'Vidhana Soudha',
    'kolkata': 'Victoria Memorial, Kolkata',
    'jaipur': 'Hawa Mahal',
    'agra': 'Taj Mahal',
    'varanasi': 'Varanasi',
    'goa': 'Goa',
    'udaipur': 'Lake Palace',
    'mysore': 'Mysore Palace',
    'mysuru': 'Mysore Palace',
    'paris': 'Eiffel Tower',
    'london': 'Big Ben',
    'new york': 'Statue of Liberty',
    'new york city': 'Statue of Liberty',
    'tokyo': 'Tokyo',
    'dubai': 'Burj Khalifa',
    'singapore': 'Marina Bay Sands',
    'bali': 'Tanah Lot',
    'rome': 'Colosseum',
    'sydney': 'Sydney Opera House',
    'bangkok': 'Wat Arun',
    'barcelona': 'Sagrada Família',
    'amsterdam': 'Amsterdam',
    'istanbul': 'Hagia Sophia',
    'cairo': 'Great Pyramid of Giza',
    'venice': 'Venice',
    'kyoto': 'Fushimi Inari-taisha',
    'prague': 'Charles Bridge',
    'lisbon': 'Belém Tower',
    'vienna': 'Schönbrunn Palace',
    'berlin': 'Brandenburg Gate',
    'athens': 'Parthenon',
    'toronto': 'CN Tower',
    'vancouver': 'Stanley Park',
    'santorini': 'Santorini',
    'queenstown': 'Milford Sound',
    'banff': 'Lake Louise, Alberta',
    'kerala': 'Alappuzha',
    'araku valley': 'Borra Caves',
    'tirupati': 'Tirumala Venkateswara Temple',
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

// ─── MediaWiki pageimages API (more reliable for thumbnails) ───────
async function fetchPageImage(title) {
    try {
        const params = new URLSearchParams({
            action: 'query',
            titles: title,
            prop: 'pageimages',
            pithumbsize: '800',
            format: 'json',
            origin: '*',
        });
        const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
        if (!res.ok) return null;
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {});
        for (const page of pages) {
            if (page.thumbnail?.source) return page.thumbnail.source;
        }
        return null;
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

        const pages = Object.values(data.query.pages);
        for (const page of pages) {
            const info = page.imageinfo?.[0];
            if (info && info.width >= 600 && info.width > info.height) {
                return info.thumburl || info.url;
            }
        }
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
 * @param {string} query   – e.g. "Hawa Mahal", "Vada Pav", "Visakhapatnam"
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

    // 2. Check ATTRACTION_IMAGES map (covers all curated destinations)
    const mappedTitle = ATTRACTION_IMAGES[key];
    if (mappedTitle) {
        // Try REST API first (higher quality images)
        let url = await fetchFromWikipedia(mappedTitle);
        if (url) {
            setCache(key, url);
            setUrl(url);
            return;
        }
        // Try MediaWiki pageimages API (more reliable)
        url = await fetchPageImage(mappedTitle);
        if (url) {
            setCache(key, url);
            setUrl(url);
            return;
        }
    }

    // 3. Check LANDMARK_QUERIES map
    const landmarkQuery = LANDMARK_QUERIES[key];
    if (landmarkQuery) {
        let url = await fetchFromWikipedia(landmarkQuery);
        if (!url) url = await fetchPageImage(landmarkQuery);
        if (url) {
            setCache(key, url);
            setUrl(url);
            return;
        }
    }

    // 4. Try the query directly on Wikipedia
    let directUrl = await fetchFromWikipedia(query);
    if (directUrl) {
        setCache(key, directUrl);
        setUrl(directUrl);
        return;
    }

    // 5. Try MediaWiki pageimages API directly
    directUrl = await fetchPageImage(query);
    if (directUrl) {
        setCache(key, directUrl);
        setUrl(directUrl);
        return;
    }

    // 6. Use Wikipedia opensearch to find the closest article title
    const titles = await findWikipediaTitle(query);
    for (const title of titles) {
        let url = await fetchFromWikipedia(title);
        if (!url) url = await fetchPageImage(title);
        if (url) {
            setCache(key, url);
            setUrl(url);
            return;
        }
    }

    // 7. Search Wikimedia Commons
    const commonsUrl = await fetchFromWikimediaCommons(query);
    if (commonsUrl) {
        setCache(key, commonsUrl);
        setUrl(commonsUrl);
        return;
    }

    // 8. Fallback: gradient remains (no broken external URL)
}
