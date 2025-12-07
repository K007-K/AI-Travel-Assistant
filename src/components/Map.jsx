import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// This handles the webpack/vite asset loading issues for marker images
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map when coordinates change
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
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

                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`, {
                            headers: {
                                'Accept-Language': 'en-US,en;q=0.9'
                            }
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
                        headers: {
                            'Accept-Language': 'en-US,en;q=0.9'
                        }
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
                            type: activity.type
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
                    <Marker key={`${marker.id}-${idx}`} position={marker.position}>
                        <Popup>
                            <div className="font-semibold text-slate-800">{marker.title}</div>
                            <div className="text-xs text-slate-500 capitalize">{marker.type}</div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;
