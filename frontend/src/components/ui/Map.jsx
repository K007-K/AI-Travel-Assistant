import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    Utensils, Bed, Camera, Tent, Landmark, Music, ShoppingBag, MapPin,
    Coffee, Sun, Plane, Train, Bus, Car, Bike, Hotel
} from 'lucide-react';

// ── Auto-fit bounds when markers change ──────────────────────────────

const FitBounds = ({ markers }) => {
    const map = useMap();

    useEffect(() => {
        if (!markers || markers.length === 0) return;

        const lats = markers.map(m => m.position[0]);
        const lons = markers.map(m => m.position[1]);

        const bounds = L.latLngBounds(
            [Math.min(...lats), Math.min(...lons)],
            [Math.max(...lats), Math.max(...lons)]
        );

        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }, [markers, map]);

    return null;
};

// Fallback: center on destination when no markers
const CenterOnDestination = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

// ── Transport-aware marker icons ─────────────────────────────────────

const TRANSPORT_ICON_MAP = {
    outbound_travel: { icon: Plane, color: 'bg-teal-500', ring: 'ring-teal-200' },
    return_travel: { icon: Plane, color: 'bg-teal-500', ring: 'ring-teal-200' },
    local_transport: { icon: Bus, color: 'bg-cyan-500', ring: 'ring-cyan-200' },
    accommodation: { icon: Hotel, color: 'bg-indigo-500', ring: 'ring-indigo-200' },
};

const ACTIVITY_ICON_MAP = [
    { match: ['food', 'restaurant', 'dinner', 'lunch', 'breakfast'], icon: Utensils, color: 'bg-orange-500', ring: 'ring-orange-200' },
    { match: ['hotel', 'stay', 'accommodation'], icon: Bed, color: 'bg-blue-500', ring: 'ring-blue-200' },
    { match: ['nature', 'park', 'hike'], icon: Tent, color: 'bg-green-500', ring: 'ring-green-200' },
    { match: ['relax', 'coffee'], icon: Coffee, color: 'bg-emerald-500', ring: 'ring-emerald-200' },
    { match: ['museum', 'culture', 'history'], icon: Landmark, color: 'bg-purple-500', ring: 'ring-purple-200' },
    { match: ['shopping', 'market'], icon: ShoppingBag, color: 'bg-pink-500', ring: 'ring-pink-200' },
    { match: ['nightlife', 'party'], icon: Music, color: 'bg-indigo-500', ring: 'ring-indigo-200' },
    { match: ['sight', 'landmark'], icon: Camera, color: 'bg-red-500', ring: 'ring-red-200' },
    { match: ['activity'], icon: Sun, color: 'bg-yellow-500', ring: 'ring-yellow-200' },
];

function getMarkerIcon(type, segmentType) {
    // Check transport types first
    if (segmentType && TRANSPORT_ICON_MAP[segmentType]) {
        const { icon: IconComponent, color, ring } = TRANSPORT_ICON_MAP[segmentType];
        return buildDivIcon(IconComponent, color, ring);
    }

    // Activity type matching
    const t = (type || '').toLowerCase();
    for (const entry of ACTIVITY_ICON_MAP) {
        if (entry.match.some(m => t.includes(m))) {
            return buildDivIcon(entry.icon, entry.color, entry.ring);
        }
    }

    return buildDivIcon(MapPin, 'bg-slate-500', 'ring-slate-300');
}

function buildDivIcon(IconComponent, colorClass, ringClass) {
    const iconHtml = renderToStaticMarkup(
        <div className={`relative w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${colorClass} ${ringClass} ring-4 ring-opacity-30`}>
            <IconComponent size={20} color="white" strokeWidth={2.5} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 transform border-b-2 border-r-2 border-slate-200"></div>
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 45],
        popupAnchor: [0, -45]
    });
}

// ── Polyline colors by segment type ──────────────────────────────────

function getPolylineColor(segmentType) {
    switch (segmentType) {
        case 'outbound_travel':
        case 'return_travel':
            return '#14b8a6'; // teal-500
        case 'local_transport':
            return '#06b6d4'; // cyan-500
        default:
            return '#6366f1'; // indigo-500 (default route)
    }
}

// ── Main Map Component ───────────────────────────────────────────────

const Map = ({ activities = [], destination }) => {
    const [markers, setMarkers] = useState([]);
    const [destCenter, setDestCenter] = useState(null);

    // Geocode activities → markers
    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!activities || activities.length === 0) {
                // Just center on destination
                if (destination) {
                    const coords = await geocode(destination);
                    if (coords) setDestCenter(coords);
                }
                return;
            }

            const newMarkers = [];

            for (const activity of activities) {
                if (!activity.location) continue;

                const query = `${activity.location}, ${destination || ''}`;
                const coords = await geocode(query);

                if (coords) {
                    newMarkers.push({
                        id: activity.id,
                        title: activity.title,
                        position: coords,
                        type: activity.type,
                        segmentType: activity.segmentType || null,
                        isLogistics: activity.isLogistics || false,
                        safety_warning: activity.safety_warning,
                    });
                }
            }

            setMarkers(newMarkers);
        };

        fetchCoordinates();
    }, [activities, destination]);

    // Build polylines: connect consecutive markers to show route
    const polylines = useMemo(() => {
        if (markers.length < 2) return [];

        const lines = [];
        for (let i = 0; i < markers.length - 1; i++) {
            const from = markers[i];
            const to = markers[i + 1];
            // Only draw polyline if positions differ meaningfully
            const dist = Math.abs(from.position[0] - to.position[0]) + Math.abs(from.position[1] - to.position[1]);
            if (dist > 0.001) {
                lines.push({
                    key: `${from.id}-${to.id}`,
                    positions: [from.position, to.position],
                    color: getPolylineColor(from.segmentType || to.segmentType),
                    isDashed: from.isLogistics || to.isLogistics,
                });
            }
        }
        return lines;
    }, [markers]);

    return (
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 z-0">
            <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                {/* Auto-fit to marker bounds, or fallback to destination center */}
                {markers.length > 0
                    ? <FitBounds markers={markers} />
                    : destCenter && <CenterOnDestination center={destCenter} zoom={10} />
                }

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Route polylines */}
                {polylines.map(line => (
                    <Polyline
                        key={line.key}
                        positions={line.positions}
                        pathOptions={{
                            color: line.color,
                            weight: 3,
                            opacity: 0.7,
                            dashArray: line.isDashed ? '8 6' : null,
                        }}
                    />
                ))}

                {/* Markers */}
                {markers.map((marker, idx) => (
                    <Marker
                        key={`${marker.id}-${idx}`}
                        position={marker.position}
                        icon={getMarkerIcon(marker.type, marker.segmentType)}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <div className="font-bold text-sm text-slate-800 mb-1">{marker.title}</div>
                                <div className="flex gap-2 items-center mb-1">
                                    <div className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                                        {marker.isLogistics ? (marker.segmentType || 'transport').replace('_', ' ') : (marker.type || 'Activity')}
                                    </div>
                                </div>
                                {marker.safety_warning && (
                                    <div className="text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100 mt-1">
                                        ⚠️ {marker.safety_warning}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <style jsx global>{`
                .leaflet-div-icon {
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
};

// ── Geocoding helper with localStorage cache ─────────────────────────

async function geocode(query) {
    if (!query) return null;

    const cacheKey = `geo:${query}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            localStorage.removeItem(cacheKey);
        }
    }

    try {
        await new Promise(r => setTimeout(r, 1200)); // Rate-limit Nominatim

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
        );

        if (!response.ok) return null;
        const data = await response.json();

        if (data && data.length > 0) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            localStorage.setItem(cacheKey, JSON.stringify(coords));
            return coords;
        }
    } catch (e) {
        console.error(`Geocode failed for "${query}":`, e);
    }

    return null;
}

export default Map;
