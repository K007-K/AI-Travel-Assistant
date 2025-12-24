import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Utensils, Bed, Camera, Tent, Landmark, Music, ShoppingBag, MapPin, Coffee, Sun } from 'lucide-react';

// Component to recenter map when coordinates change
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

// Helper to create custom marker icons
const getMarkerIcon = (type) => {
    let IconComponent = MapPin;
    let colorClass = 'bg-slate-500';
    let ringClass = 'ring-slate-300';

    // Normalize type
    const t = type?.toLowerCase() || '';

    if (t.includes('food') || t.includes('restaurant') || t.includes('dinner') || t.includes('lunch') || t.includes('breakfast')) {
        IconComponent = Utensils;
        colorClass = 'bg-orange-500';
        ringClass = 'ring-orange-200';
    } else if (t.includes('hotel') || t.includes('stay') || t.includes('accommodation')) {
        IconComponent = Bed;
        colorClass = 'bg-blue-500';
        ringClass = 'ring-blue-200';
    } else if (t.includes('nature') || t.includes('park') || t.includes('hike')) {
        IconComponent = Tent; // or Trees if available, but Tent is reliable for outdoors
        colorClass = 'bg-green-500';
        ringClass = 'ring-green-200';
    } else if (t.includes('relax') || t.includes('coffee')) {
        IconComponent = Coffee;
        colorClass = 'bg-emerald-500';
        ringClass = 'ring-emerald-200';
    } else if (t.includes('museum') || t.includes('culture') || t.includes('history')) {
        IconComponent = Landmark;
        colorClass = 'bg-purple-500';
        ringClass = 'ring-purple-200';
    } else if (t.includes('shopping') || t.includes('market')) {
        IconComponent = ShoppingBag;
        colorClass = 'bg-pink-500';
        ringClass = 'ring-pink-200';
    } else if (t.includes('nightlife') || t.includes('party')) {
        IconComponent = Music;
        colorClass = 'bg-indigo-500';
        ringClass = 'ring-indigo-200';
    } else if (t.includes('sight') || t.includes('landmark')) {
        IconComponent = Camera;
        colorClass = 'bg-red-500';
        ringClass = 'ring-red-200';
    } else if (t.includes('activity')) {
        IconComponent = Sun;
        colorClass = 'bg-yellow-500';
        ringClass = 'ring-yellow-200';
    }

    const iconHtml = renderToStaticMarkup(
        <div className={`relative w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${colorClass} ${ringClass} ring-4 ring-opacity-30`}>
            <IconComponent size={20} color="white" strokeWidth={2.5} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 transform border-b-2 border-r-2 border-slate-200"></div>
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-icon', // Use this class to remove default styles if needed
        iconSize: [40, 40],
        iconAnchor: [20, 45], // Anchored at bottom tip
        popupAnchor: [0, -45]
    });
};

const Map = ({ activities = [], destination }) => {
    const [markers, setMarkers] = useState([]);
    const [center, setCenter] = useState([20, 0]); // Default global view
    const [zoom, setZoom] = useState(2);

    // Geocode locations to coordinates
    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!activities || activities.length === 0) {
                // Try to just center on destination if no activities
                if (destination) {
                    try {
                        const cacheKey = `geo:${destination}`;
                        const cached = localStorage.getItem(cacheKey);

                        if (cached) {
                            const data = JSON.parse(cached);
                            setCenter(data);
                            setZoom(10);
                            return;
                        }

                        // Delay to prevent rate limiting if multiple components mount
                        await new Promise(r => setTimeout(r, 500));

                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`, {
                            headers: { 'Accept-Language': 'en-US,en;q=0.9' }
                        });
                        const data = await response.json();
                        if (data && data.length > 0) {
                            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                            localStorage.setItem(cacheKey, JSON.stringify(coords));
                            setCenter(coords);
                            setZoom(10);
                        }
                    } catch (e) {
                        console.error("Failed to locate destination", e);
                    }
                }
                return;
            }

            const newMarkers = [];
            let boundsLat = [];
            let boundsLon = [];

            // Process sequentially to be nice to the free API (Nominatim rate limits)
            for (const activity of activities) {
                if (!activity.location) continue;

                // Check cache first
                const cacheKey = `geo:${activity.location}`;
                const cached = localStorage.getItem(cacheKey);

                if (cached) {
                    try {
                        const [lat, lon] = JSON.parse(cached);
                        newMarkers.push({
                            id: activity.id,
                            title: activity.title,
                            position: [lat, lon],
                            type: activity.type
                        });
                        boundsLat.push(lat);
                        boundsLon.push(lon);
                        continue; // Skip fetch if cached
                    } catch (e) {
                        localStorage.removeItem(cacheKey);
                    }
                }

                try {
                    // Add delay to avoid rate limiting
                    await new Promise(r => setTimeout(r, 1200));

                    const query = `${activity.location}, ${destination || ''}`;
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
                    });

                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                    const data = await response.json();

                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);

                        // Cache the result
                        localStorage.setItem(cacheKey, JSON.stringify([lat, lon]));

                        newMarkers.push({
                            id: activity.id,
                            title: activity.title,
                            position: [lat, lon],
                            type: activity.type,
                            safety_warning: activity.safety_warning
                        });

                        boundsLat.push(lat);
                        boundsLon.push(lon);
                    }
                } catch (error) {
                    console.error(`Failed to geocode ${activity.location}:`, error);
                }
            }

            setMarkers(newMarkers);

            // Calculate center
            if (newMarkers.length > 0) {
                const avgLat = boundsLat.reduce((a, b) => a + b, 0) / newMarkers.length;
                const avgLon = boundsLon.reduce((a, b) => a + b, 0) / newMarkers.length;
                setCenter([avgLat, avgLon]);
                setZoom(12);
            }
        };

        fetchCoordinates();
    }, [activities, destination]);

    return (
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 z-0">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <ChangeView center={center} zoom={zoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker, idx) => (
                    <Marker
                        key={`${marker.id}-${idx}`}
                        position={marker.position}
                        icon={getMarkerIcon(marker.type)}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <div className="font-bold text-sm text-slate-800 mb-1">{marker.title}</div>
                                <div className="flex gap-2 items-center mb-1">
                                    <div className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                                        {marker.type || 'Activity'}
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

            {/* Styles for removing default divIcon background if needed */}
            <style jsx global>{`
                .leaflet-div-icon {
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default Map;
