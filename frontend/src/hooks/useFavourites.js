import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'roameo_favourites';

/**
 * Read favourites from localStorage.
 * Each favourite is a destination object { id, name, location, country, image, rating, tags, ... }
 */
function readFavourites() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeFavourites(favs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    } catch { /* quota */ }
}

/**
 * Hook for managing destination favourites.
 * Persists in localStorage and syncs across components via storage events.
 */
export default function useFavourites() {
    const [favourites, setFavourites] = useState(readFavourites);

    // Sync with other tabs / components that modify storage
    useEffect(() => {
        const handler = (e) => {
            if (e.key === STORAGE_KEY) setFavourites(readFavourites());
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const isFavourite = useCallback(
        (destId) => favourites.some(f => f.id === destId),
        [favourites]
    );

    const toggleFavourite = useCallback((destination) => {
        setFavourites(prev => {
            const exists = prev.some(f => f.id === destination.id);
            const next = exists
                ? prev.filter(f => f.id !== destination.id)
                : [...prev, {
                    id: destination.id,
                    name: destination.name,
                    location: destination.location || '',
                    country: destination.country || '',
                    image: destination.image || null,
                    rating: destination.rating || null,
                    tags: destination.tags || [],
                    description: destination.description || '',
                    _source: destination._source || 'curated',
                    savedAt: Date.now(),
                }];
            writeFavourites(next);
            return next;
        });
    }, []);

    const removeFavourite = useCallback((destId) => {
        setFavourites(prev => {
            const next = prev.filter(f => f.id !== destId);
            writeFavourites(next);
            return next;
        });
    }, []);

    return { favourites, isFavourite, toggleFavourite, removeFavourite };
}
