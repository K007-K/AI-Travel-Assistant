/**
 * Curated destination images from Unsplash (direct links, not the deprecated source.unsplash.com)
 * Fallback: returns a gradient placeholder URL via ui-avatars for unknown destinations.
 */

const DESTINATION_IMAGES = {
    // India
    'visakhapatnam': 'https://images.unsplash.com/photo-1614094082869-cd4e4b2c0c5e?w=800&h=600&fit=crop&q=80',
    'vizag': 'https://images.unsplash.com/photo-1614094082869-cd4e4b2c0c5e?w=800&h=600&fit=crop&q=80',
    'hyderabad': 'https://images.unsplash.com/photo-1572638000660-b20e0e388b63?w=800&h=600&fit=crop&q=80',
    'mumbai': 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&h=600&fit=crop&q=80',
    'delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop&q=80',
    'new delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=600&fit=crop&q=80',
    'bangalore': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&h=600&fit=crop&q=80',
    'bengaluru': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&h=600&fit=crop&q=80',
    'chennai': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&h=600&fit=crop&q=80',
    'kolkata': 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&h=600&fit=crop&q=80',
    'jaipur': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&h=600&fit=crop&q=80',
    'goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop&q=80',
    'agra': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop&q=80',
    'varanasi': 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&h=600&fit=crop&q=80',
    'udaipur': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=600&fit=crop&q=80',
    'pune': 'https://images.unsplash.com/photo-1572638000660-b20e0e388b63?w=800&h=600&fit=crop&q=80',
    'kerala': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=600&fit=crop&q=80',
    'manali': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&h=600&fit=crop&q=80',
    'shimla': 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800&h=600&fit=crop&q=80',
    'darjeeling': 'https://images.unsplash.com/photo-1622308644420-0f7daa982665?w=800&h=600&fit=crop&q=80',
    'araku': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
    'mysore': 'https://images.unsplash.com/photo-1600100397608-e4b1644d47fc?w=800&h=600&fit=crop&q=80',
    'srinagar': 'https://images.unsplash.com/photo-1587135941948-670b381f08ce?w=800&h=600&fit=crop&q=80',
    'rishikesh': 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=800&h=600&fit=crop&q=80',
    'pondicherry': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&h=600&fit=crop&q=80',
    'ooty': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',

    // World
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop&q=80',
    'tokyo': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&h=600&fit=crop&q=80',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop&q=80',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop&q=80',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop&q=80',
    'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop&q=80',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop&q=80',
    'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop&q=80',
    'maldives': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop&q=80',
    'bangkok': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&h=600&fit=crop&q=80',
    'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop&q=80',
    'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop&q=80',
    'istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop&q=80',
    'cairo': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop&q=80',
    'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&q=80',
    'venice': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop&q=80',
    'santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop&q=80',
    'machu picchu': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&q=80',
    'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop&q=80',
    'prague': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=600&fit=crop&q=80',
    'lisbon': 'https://images.unsplash.com/photo-1513735492284-ecf18d81de76?w=800&h=600&fit=crop&q=80',
    'seoul': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=600&fit=crop&q=80',
    'kuala lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop&q=80',
    'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&h=600&fit=crop&q=80',
    'moscow': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&h=600&fit=crop&q=80',
};

// Gradient colors for fallback
const GRADIENT_COLORS = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'],
    ['#e0c3fc', '#8ec5fc'],
];

/**
 * Get a reliable image URL for a destination.
 * Uses curated Unsplash images for known destinations,
 * and a gradient SVG data URI for unknown ones.
 */
export function getDestinationImage(destination) {
    if (!destination) return getFallbackImage('Travel');

    const key = destination.toLowerCase().trim();

    // Check exact match
    if (DESTINATION_IMAGES[key]) {
        return DESTINATION_IMAGES[key];
    }

    // Check partial match (e.g., "Visakhapatnam, India" matches "visakhapatnam")
    for (const [name, url] of Object.entries(DESTINATION_IMAGES)) {
        if (key.includes(name) || name.includes(key)) {
            return url;
        }
    }

    // Fallback: generate an SVG gradient with the destination initial
    return getFallbackImage(destination);
}

function getFallbackImage(destination) {
    const hash = destination.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
    const initial = destination.charAt(0).toUpperCase();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${colors[0]}" />
                <stop offset="100%" style="stop-color:${colors[1]}" />
            </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#g)" />
        <text x="400" y="320" font-family="sans-serif" font-size="120" font-weight="bold" fill="rgba(255,255,255,0.3)" text-anchor="middle" dominant-baseline="central">${initial}</text>
    </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
