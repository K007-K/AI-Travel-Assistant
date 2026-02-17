/**
 * City Coordinates — Unit Tests
 *
 * Tests: data structure, coordinate ranges, known cities, lookup functions.
 */
import { describe, it, expect } from 'vitest';
import { getCityCoords, getCityCoordsLong, CITY_COORDINATES } from '@/data/cityCoordinates.js';

// ── Data structure validation ───────────────────────────────────────

describe('CITY_COORDINATES data', () => {
    it('should be a non-empty object', () => {
        expect(typeof CITY_COORDINATES).toBe('object');
        expect(Object.keys(CITY_COORDINATES).length).toBeGreaterThan(50);
    });

    it('every entry should have numeric lat and lng', () => {
        for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
            expect(typeof coords.lat).toBe('number');
            expect(typeof coords.lng).toBe('number');
        }
    });

    it('all latitudes should be in range [-90, 90]', () => {
        for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
            expect(coords.lat).toBeGreaterThanOrEqual(-90);
            expect(coords.lat).toBeLessThanOrEqual(90);
        }
    });

    it('all longitudes should be in range [-180, 180]', () => {
        for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
            expect(coords.lng).toBeGreaterThanOrEqual(-180);
            expect(coords.lng).toBeLessThanOrEqual(180);
        }
    });

    it('all keys should be lowercase', () => {
        for (const key of Object.keys(CITY_COORDINATES)) {
            expect(key).toBe(key.toLowerCase());
        }
    });
});

// ── Known cities present ────────────────────────────────────────────

describe('known cities', () => {
    const knownCities = [
        'mumbai', 'delhi', 'bangalore', 'tokyo', 'paris',
        'london', 'new york', 'sydney', 'dubai', 'singapore',
    ];

    it.each(knownCities)('should contain "%s"', (city) => {
        expect(CITY_COORDINATES[city]).toBeDefined();
        expect(CITY_COORDINATES[city].lat).toBeDefined();
        expect(CITY_COORDINATES[city].lng).toBeDefined();
    });
});

// ── Alias consistency ───────────────────────────────────────────────

describe('city aliases', () => {
    it('bangalore and bengaluru should have same coordinates', () => {
        expect(CITY_COORDINATES['bangalore']).toEqual(CITY_COORDINATES['bengaluru']);
    });

    it('mysore and mysuru should have same coordinates', () => {
        expect(CITY_COORDINATES['mysore']).toEqual(CITY_COORDINATES['mysuru']);
    });

    it('visakhapatnam and vizag should have same coordinates', () => {
        expect(CITY_COORDINATES['visakhapatnam']).toEqual(CITY_COORDINATES['vizag']);
    });
});

// ── getCityCoords ───────────────────────────────────────────────────

describe('getCityCoords', () => {
    it('should return coords for exact match', () => {
        const result = getCityCoords('mumbai');
        expect(result).toEqual({ lat: 19.0760, lng: 72.8777 });
    });

    it('should be case-insensitive', () => {
        const result = getCityCoords('MUMBAI');
        expect(result).not.toBeNull();
        expect(result.lat).toBe(19.0760);
    });

    it('should handle leading/trailing whitespace', () => {
        const result = getCityCoords('  delhi  ');
        expect(result).not.toBeNull();
    });

    it('should do partial match', () => {
        const result = getCityCoords('new delhi');
        expect(result).not.toBeNull();
    });

    it('should return null for unknown cities', () => {
        expect(getCityCoords('FakeCity42')).toBeNull();
    });

    it('should return null for null/empty input', () => {
        expect(getCityCoords(null)).toBeNull();
        expect(getCityCoords('')).toBeNull();
    });
});

// ── getCityCoordsLong ───────────────────────────────────────────────

describe('getCityCoordsLong', () => {
    it('should return { latitude, longitude } format', () => {
        const result = getCityCoordsLong('mumbai');
        expect(result).toHaveProperty('latitude');
        expect(result).toHaveProperty('longitude');
        expect(result.latitude).toBe(19.0760);
        expect(result.longitude).toBe(72.8777);
    });

    it('should return null for unknown cities', () => {
        expect(getCityCoordsLong('NonExistentPlace')).toBeNull();
    });
});
