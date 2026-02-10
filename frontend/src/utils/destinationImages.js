/**
 * Dynamic destination images using Wikipedia REST API.
 * Fetches real photos of cities/destinations — no API key needed.
 * Results are cached in localStorage to avoid re-fetching.
 */

const CACHE_KEY = 'destination_image_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // Evict stale entries
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
    } catch { /* quota exceeded — ignore */ }
}

/**
 * Fetch destination image from Wikipedia REST API.
 * Returns a URL string or null if not found.
 */
async function fetchWikipediaImage(destination) {
    try {
        const query = encodeURIComponent(destination.trim());
        const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        // prefer originalimage (higher res), fallback to thumbnail
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

/**
 * Generate a gradient SVG data URI as fallback.
 */
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
 * Get destination image — checks cache first, then fetches from Wikipedia.
 * Returns { url, loading } initially, calls onLoad when the real image is ready.
 *
 * Usage:
 *   const [imgUrl, setImgUrl] = useState(getFallbackImage(destination));
 *   useEffect(() => { loadDestinationImage(destination, setImgUrl); }, [destination]);
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

    // 2. Fetch from Wikipedia
    const url = await fetchWikipediaImage(destination);
    if (url) {
        setCache(key, url);
        setUrl(url);
    }
    // If Wikipedia fails, the fallback image remains
}
