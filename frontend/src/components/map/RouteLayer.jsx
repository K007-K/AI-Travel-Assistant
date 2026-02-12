import { useEffect, useRef } from 'react';

/**
 * Transport-mode styling for route lines.
 */
const TRANSPORT_STYLES = {
    outbound_travel: { color: '#a855f7', dasharray: [6, 4], width: 3 },  // purple dashed (flight)
    intercity_travel: { color: '#3b82f6', dasharray: null, width: 3 },    // blue solid (train/bus)
    return_travel: { color: '#a855f7', dasharray: [6, 4], width: 3 },  // purple dashed (flight)
    local_transport: { color: '#06b6d4', dasharray: [2, 3], width: 2.5 }, // cyan dotted
    accommodation: { color: '#6366f1', dasharray: null, width: 2 },     // indigo solid
    flight: { color: '#a855f7', dasharray: [6, 4], width: 3 },
    train: { color: '#3b82f6', dasharray: null, width: 3 },     // blue solid
    car: { color: '#22c55e', dasharray: null, width: 3 },     // green solid
    bike: { color: '#f97316', dasharray: null, width: 3 },     // orange solid
    auto: { color: '#06b6d4', dasharray: [2, 3], width: 2.5 }, // cyan dotted
    walking: { color: '#9ca3af', dasharray: [3, 4], width: 2 },   // gray thin dashed
    bus: { color: '#3b82f6', dasharray: null, width: 3 },     // blue solid
};

const DEFAULT_STYLE = { color: '#6366f1', dasharray: null, width: 3 };

/**
 * RouteLayer — adds GeoJSON route geometries as styled polylines to the MapLibre map.
 * Falls back to straight-line between consecutive markers if no route_geometry.
 */
export default function RouteLayer({ map, routes, markers }) {
    const addedIds = useRef(new Set());

    useEffect(() => {
        if (!map) return;

        // Wait for map style to load
        const addRoutes = () => {
            // Clean up old layers
            for (const id of addedIds.current) {
                if (map.getLayer(`route-layer-${id}`)) map.removeLayer(`route-layer-${id}`);
                if (map.getSource(`route-source-${id}`)) map.removeSource(`route-source-${id}`);
            }
            addedIds.current.clear();

            // Add stored route geometries
            for (const route of routes) {
                const style = TRANSPORT_STYLES[route.transportMode] || DEFAULT_STYLE;

                map.addSource(`route-source-${route.id}`, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: route.geometry,
                        properties: { mode: route.transportMode }
                    }
                });

                const paintProps = {
                    'line-color': style.color,
                    'line-width': style.width,
                    'line-opacity': 0.7,
                };

                const layoutProps = {
                    'line-join': 'round',
                    'line-cap': 'round',
                };

                if (style.dasharray) {
                    paintProps['line-dasharray'] = style.dasharray;
                }

                map.addLayer({
                    id: `route-layer-${route.id}`,
                    type: 'line',
                    source: `route-source-${route.id}`,
                    paint: paintProps,
                    layout: layoutProps,
                });

                addedIds.current.add(route.id);
            }

            // Fallback: straight-line connections between consecutive markers
            if (routes.length === 0 && markers.length >= 2) {
                const coords = markers.map(m => [m.lng, m.lat]);
                const fallbackId = 'fallback-route';

                map.addSource(`route-source-${fallbackId}`, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: coords },
                        properties: {}
                    }
                });

                map.addLayer({
                    id: `route-layer-${fallbackId}`,
                    type: 'line',
                    source: `route-source-${fallbackId}`,
                    paint: {
                        'line-color': '#6366f1',
                        'line-width': 2,
                        'line-opacity': 0.5,
                        'line-dasharray': [4, 4],
                    },
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                });

                addedIds.current.add(fallbackId);
            }
        };

        if (map.isStyleLoaded()) {
            addRoutes();
        } else {
            map.on('load', addRoutes);
        }

        return () => {
            // Cleanup
            for (const id of addedIds.current) {
                if (map.getLayer(`route-layer-${id}`)) map.removeLayer(`route-layer-${id}`);
                if (map.getSource(`route-source-${id}`)) map.removeSource(`route-source-${id}`);
            }
            addedIds.current.clear();
        };
    }, [map, routes, markers]);

    return null; // Renders nothing — purely imperative
}
