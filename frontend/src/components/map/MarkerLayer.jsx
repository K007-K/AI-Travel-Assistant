import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

/**
 * Transport-type emoji and colors for marker icons.
 */
const TRANSPORT_ICONS = {
    outbound_travel: { emoji: '✈️', bg: '#14b8a6' },
    intercity_travel: { emoji: '🚆', bg: '#14b8a6' },
    return_travel: { emoji: '✈️', bg: '#14b8a6' },
    local_transport: { emoji: '🚗', bg: '#06b6d4' },
    accommodation: { emoji: '🏨', bg: '#6366f1' },
};

const ACTIVITY_ICONS = [
    { match: ['food', 'restaurant', 'dinner', 'lunch', 'breakfast'], emoji: '🍽️', bg: '#f97316' },
    { match: ['hotel', 'stay'], emoji: '🏨', bg: '#3b82f6' },
    { match: ['nature', 'park', 'hike'], emoji: '🌿', bg: '#22c55e' },
    { match: ['museum', 'culture', 'history'], emoji: '🏛️', bg: '#a855f7' },
    { match: ['shopping', 'market'], emoji: '🛍️', bg: '#ec4899' },
    { match: ['nightlife', 'party'], emoji: '🎵', bg: '#6366f1' },
    { match: ['sight', 'landmark', 'sightseeing'], emoji: '📸', bg: '#ef4444' },
    { match: ['relax', 'coffee'], emoji: '☕', bg: '#10b981' },
];

function getMarkerConfig(type, segmentType) {
    if (segmentType && TRANSPORT_ICONS[segmentType]) {
        return TRANSPORT_ICONS[segmentType];
    }
    const t = (type || '').toLowerCase();
    for (const entry of ACTIVITY_ICONS) {
        if (entry.match.some(m => t.includes(m))) return entry;
    }
    return { emoji: '📍', bg: '#64748b' };
}

/**
 * MarkerLayer — adds lightweight HTML markers to the MapLibre map.
 * Tracks markers via ref to prevent re-rendering unchanged ones.
 */
export default function MarkerLayer({ map, markers }) {
    const markerRefs = useRef([]);

    useEffect(() => {
        if (!map) return;

        // Remove old markers
        markerRefs.current.forEach(m => m.remove());
        markerRefs.current = [];

        for (const marker of markers) {
            const config = getMarkerConfig(marker.type, marker.segmentType);

            // Create custom HTML element
            const el = document.createElement('div');
            el.className = 'maplibre-custom-marker';
            el.dataset.segmentId = marker.id;
            el.innerHTML = `
                <div style="
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    background: ${config.bg};
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px; cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.2)'" 
                   onmouseout="this.style.transform='scale(1)'">
                    ${config.emoji}
                </div>
            `;

            // Popup content
            const popupHtml = `
                <div style="font-family: system-ui, sans-serif; max-width: 200px;">
                    <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${marker.title}</div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;">
                        <span style="font-size: 11px; padding: 1px 8px; border-radius: 999px; background: #f1f5f9; color: #475569;">
                            ${marker.isLogistics ? (marker.segmentType || 'transport').replace(/_/g, ' ') : (marker.type || 'Activity')}
                        </span>
                        <span style="font-size: 11px; padding: 1px 8px; border-radius: 999px; background: #dbeafe; color: #1e40af;">
                            Day ${marker.dayNumber}
                        </span>
                    </div>
                    ${marker.location ? `<div style="font-size: 11px; color: #64748b;">📍 ${marker.location}</div>` : ''}
                    ${marker.safety_warning ? `<div style="font-size: 11px; color: #dc2626; background: #fef2f2; padding: 4px 6px; border-radius: 6px; margin-top: 4px;">⚠️ ${marker.safety_warning}</div>` : ''}
                </div>
            `;

            const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
                .setHTML(popupHtml);

            const mlMarker = new maplibregl.Marker({ element: el })
                .setLngLat([marker.lng, marker.lat])
                .setPopup(popup)
                .addTo(map);

            markerRefs.current.push(mlMarker);
        }

        return () => {
            markerRefs.current.forEach(m => m.remove());
            markerRefs.current = [];
        };
    }, [map, markers]);

    return null; // Renders nothing — purely imperative
}
