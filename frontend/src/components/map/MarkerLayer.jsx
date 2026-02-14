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
 * Clicking a pin zooms into that location; clicking again zooms back out.
 */
export default function MarkerLayer({ map, markers, bounds, onPinClick }) {
    const markerRefs = useRef([]);
    const focusedIdRef = useRef(null);

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
                " onmouseover="this.style.transform='scale(1.3)'" 
                   onmouseout="this.style.transform='scale(1)'">
                    ${config.emoji}
                </div>
            `;

            // Popup content — detailed view shown on zoom-in
            const popupHtml = `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 240px; padding: 2px;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #1e293b;">${marker.title}</div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
                        <span style="font-size: 11px; padding: 2px 10px; border-radius: 999px; background: ${config.bg}22; color: ${config.bg}; font-weight: 600;">
                            ${marker.isLogistics ? (marker.segmentType || 'transport').replace(/_/g, ' ') : (marker.type || 'Activity')}
                        </span>
                        <span style="font-size: 11px; padding: 2px 10px; border-radius: 999px; background: #dbeafe; color: #1e40af; font-weight: 600;">
                            Day ${marker.dayNumber}
                        </span>
                    </div>
                    ${marker.location ? `<div style="font-size: 12px; color: #475569; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">📍 ${marker.location}</div>` : ''}
                    ${marker.estimatedCost > 0 ? `<div style="font-size: 12px; color: #059669; font-weight: 600; margin-bottom: 4px;">💰 ₹${marker.estimatedCost.toLocaleString()}</div>` : ''}
                    ${marker.safety_warning ? `<div style="font-size: 11px; color: #dc2626; background: #fef2f2; padding: 6px 8px; border-radius: 8px; margin-top: 6px; line-height: 1.4;">⚠️ ${marker.safety_warning}</div>` : ''}
                    <div style="font-size: 10px; color: #94a3b8; margin-top: 8px; text-align: center; cursor: pointer;">Click pin again to zoom out</div>
                </div>
            `;

            const popup = new maplibregl.Popup({ offset: 20, closeButton: true, maxWidth: '260px' })
                .setHTML(popupHtml);

            const mlMarker = new maplibregl.Marker({ element: el })
                .setLngLat([marker.lng, marker.lat])
                .setPopup(popup)
                .addTo(map);

            // Click handler: fly to pin and show popup, or zoom back out
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (focusedIdRef.current === marker.id) {
                    // Already focused — zoom back to full itinerary
                    focusedIdRef.current = null;
                    mlMarker.getPopup().remove();
                    if (bounds) {
                        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
                    }
                    if (onPinClick) onPinClick(null);
                } else {
                    // Close any other open popups
                    markerRefs.current.forEach(m => { if (m.getPopup().isOpen()) m.togglePopup(); });
                    // Fly to this pin and open its popup
                    focusedIdRef.current = marker.id;
                    map.flyTo({
                        center: [marker.lng, marker.lat],
                        zoom: 15,
                        duration: 1000,
                        essential: true,
                    });
                    // Open popup after fly animation completes
                    setTimeout(() => {
                        if (!mlMarker.getPopup().isOpen()) mlMarker.togglePopup();
                    }, 1100);
                    if (onPinClick) onPinClick(marker.id);
                }
            });

            markerRefs.current.push(mlMarker);
        }

        return () => {
            markerRefs.current.forEach(m => m.remove());
            markerRefs.current = [];
        };
    }, [map, markers, bounds]);

    return null; // Renders nothing — purely imperative
}
