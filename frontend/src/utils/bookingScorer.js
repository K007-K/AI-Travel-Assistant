/**
 * Booking Scoring Engine
 * 
 * Generates deterministic, context-aware booking results with composite scores.
 * Replaces the old random generateMockResults with structured data and a
 * transparent scoring formula for flights, hotels, and trains.
 *
 * Rule 8: All results are synthetic / estimated. No real API integration.
 * Results MUST be labeled as "Estimated Results (Demo Mode)" in the UI.
 */

// ── Rule 8: Demo Mode Flag ──────────────────────────────────────────
export const BOOKING_IS_DEMO = true;
export const BOOKING_DEMO_LABEL = 'Estimated Results (Demo Mode)';

// ── Airline / Hotel / Train provider databases ───────────────────────

const AIRLINES = [
    { name: 'IndiGo', code: '6E', logo: '✈️', tier: 'budget', onTimeRate: 0.82 },
    { name: 'Air India', code: 'AI', logo: '🦅', tier: 'mid-range', onTimeRate: 0.74 },
    { name: 'Vistara', code: 'UK', logo: '🦁', tier: 'premium', onTimeRate: 0.86 },
    { name: 'Emirates', code: 'EK', logo: '🌍', tier: 'luxury', onTimeRate: 0.91 },
    { name: 'SpiceJet', code: 'SG', logo: '🌶️', tier: 'budget', onTimeRate: 0.72 },
    { name: 'AirAsia', code: 'I5', logo: '🅰️', tier: 'budget', onTimeRate: 0.78 },
];

const HOTEL_BRANDS = [
    { name: 'Grand', suffix: 'Hotel', tier: 'luxury', baseRating: 4.5 },
    { name: 'Royal', suffix: 'Resort', tier: 'luxury', baseRating: 4.3 },
    { name: 'Cozy', suffix: 'Inn', tier: 'budget', baseRating: 3.8 },
    { name: 'Urban', suffix: 'Stay', tier: 'mid-range', baseRating: 4.0 },
    { name: 'Seaside', suffix: 'Suites', tier: 'mid-range', baseRating: 4.1 },
    { name: 'Backpacker', suffix: 'Hostel', tier: 'budget', baseRating: 3.5 },
    { name: 'Heritage', suffix: 'Palace', tier: 'luxury', baseRating: 4.7 },
    { name: 'Comfort', suffix: 'Lodge', tier: 'mid-range', baseRating: 3.9 },
];

const TRAINS = [
    { name: 'Rajdhani Express', class: 'premium', speedFactor: 1.0 },
    { name: 'Shatabdi Express', class: 'premium', speedFactor: 0.9 },
    { name: 'Duronto Express', class: 'mid-range', speedFactor: 0.85 },
    { name: 'Intercity Express', class: 'mid-range', speedFactor: 0.7 },
    { name: 'Garib Rath', class: 'budget', speedFactor: 0.6 },
    { name: 'Jan Shatabdi', class: 'budget', speedFactor: 0.65 },
];

const AMENITIES_POOL = ['Wifi', 'Pool', 'Breakfast', 'Gym', 'Spa', 'Parking', 'Restaurant', 'Room Service'];

// ── Deterministic pseudo-random (seeded by search params) ────────────

function seededHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash);
}

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// ── Scoring Formula ──────────────────────────────────────────────────

/**
 * Composite score formula (0–100):
 * 
 * FLIGHTS:  40% price + 25% duration + 20% stops + 15% on-time
 * HOTELS:   35% price + 30% rating + 20% amenities + 15% reviews
 * TRAINS:   40% price + 30% duration + 15% class + 15% availability
 */

function scoreFlightResult(result, allResults) {
    const prices = allResults.map(r => r.price);
    const durations = allResults.map(r => r.durationMinutes);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDur = Math.min(...durations);
    const maxDur = Math.max(...durations);

    const priceScore = maxPrice > minPrice ? (1 - (result.price - minPrice) / (maxPrice - minPrice)) * 100 : 50;
    const durationScore = maxDur > minDur ? (1 - (result.durationMinutes - minDur) / (maxDur - minDur)) * 100 : 50;
    const stopsScore = result.stops === 'Non-stop' ? 100 : result.stops === '1 Stop' ? 50 : 20;
    const onTimeScore = (result.onTimeRate || 0.8) * 100;

    return Math.round(priceScore * 0.40 + durationScore * 0.25 + stopsScore * 0.20 + onTimeScore * 0.15);
}

function scoreHotelResult(result, allResults) {
    const prices = allResults.map(r => r.price);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const priceScore = maxPrice > minPrice ? (1 - (result.price - minPrice) / (maxPrice - minPrice)) * 100 : 50;
    const ratingScore = ((result.rating - 3) / 2) * 100; // 3.0→0, 5.0→100
    const amenityScore = (result.amenities.length / AMENITIES_POOL.length) * 100;
    const reviewScore = Math.min(result.reviews / 500, 1) * 100;

    return Math.round(priceScore * 0.35 + ratingScore * 0.30 + amenityScore * 0.20 + reviewScore * 0.15);
}

function scoreTrainResult(result, allResults) {
    const prices = allResults.map(r => r.price);
    const durations = allResults.map(r => r.durationMinutes);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDur = Math.min(...durations);
    const maxDur = Math.max(...durations);

    const priceScore = maxPrice > minPrice ? (1 - (result.price - minPrice) / (maxPrice - minPrice)) * 100 : 50;
    const durationScore = maxDur > minDur ? (1 - (result.durationMinutes - minDur) / (maxDur - minDur)) * 100 : 50;
    const classScore = result.trainTier === 'premium' ? 90 : result.trainTier === 'mid-range' ? 60 : 30;
    const seatScore = Math.min(result.seats / 50, 1) * 100;

    return Math.round(priceScore * 0.40 + durationScore * 0.30 + classScore * 0.15 + seatScore * 0.15);
}

// ── Result Generators ────────────────────────────────────────────────

export function generateFlightResults(formData, currencyRate = 1) {
    const seed = seededHash(`${formData.origin}-${formData.destination}-${formData.date}-flights`);
    const count = 4 + (seed % 4); // 4–7 results
    const results = [];

    for (let i = 0; i < count; i++) {
        const r = seededRandom(seed + i * 7);
        const airline = AIRLINES[Math.floor(r * AIRLINES.length)];

        // Structured departure times spread across morning/afternoon/evening
        const timeSlots = [6, 8, 10, 12, 14, 16, 18, 21];
        const depHour = timeSlots[i % timeSlots.length];
        const depMin = Math.floor(seededRandom(seed + i * 13) * 4) * 15; // 0, 15, 30, 45

        // Duration: 1–6h, influenced by tier (budget = slightly longer)
        const baseDuration = 90 + Math.floor(seededRandom(seed + i * 17) * 240); // 90–330 min
        const durationMinutes = Math.round(baseDuration * (airline.tier === 'budget' ? 1.1 : 1.0));
        const arrHour = (depHour + Math.floor(durationMinutes / 60)) % 24;
        const arrMin = (depMin + durationMinutes % 60) % 60;

        // Stops: non-stop for short, 1 stop for longer
        const stops = durationMinutes > 240 ? (seededRandom(seed + i * 19) > 0.4 ? '1 Stop' : 'Non-stop') : 'Non-stop';

        // Pricing: tier-based base + duration factor
        const tierMultiplier = { budget: 0.7, 'mid-range': 1.0, premium: 1.4, luxury: 2.2 };
        const basePrice = 50 + Math.floor(durationMinutes * 0.3);
        const price = Math.round(basePrice * (tierMultiplier[airline.tier] || 1) * currencyRate);

        results.push({
            id: `flight-${i}`,
            type: 'flight',
            airline: airline.name,
            logo: airline.logo,
            flightNumber: `${airline.code}-${100 + (seed + i * 3) % 900}`,
            depTime: `${depHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`,
            arrTime: `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`,
            duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
            durationMinutes,
            stops,
            price,
            onTimeRate: airline.onTimeRate,
            tier: airline.tier,
        });
    }

    // Score all results
    results.forEach(r => {
        r.score = scoreFlightResult(r, results);
    });

    // Tag the best result
    const bestIdx = results.reduce((best, r, i) => r.score > results[best].score ? i : best, 0);
    results[bestIdx].isBest = true;

    return results;
}

export function generateHotelResults(formData, currencyRate = 1) {
    const seed = seededHash(`${formData.destination}-${formData.date}-hotels`);
    const count = 4 + (seed % 4);
    const results = [];

    for (let i = 0; i < count; i++) {
        const r = seededRandom(seed + i * 11);
        const brand = HOTEL_BRANDS[Math.floor(r * HOTEL_BRANDS.length)];

        // Rating: base ± small variation
        const rating = Math.min(5, Math.max(3, brand.baseRating + (seededRandom(seed + i * 23) - 0.5) * 0.4)).toFixed(1);

        // Pricing: tier-based
        const tierBase = { budget: 30, 'mid-range': 80, luxury: 220 };
        const basePrice = tierBase[brand.tier] || 80;
        const price = Math.round((basePrice + seededRandom(seed + i * 29) * 40) * currencyRate);

        // Amenities: more for higher tier
        const amenityCount = brand.tier === 'luxury' ? 5 : brand.tier === 'mid-range' ? 3 : 2;
        const amenities = [];
        for (let a = 0; a < amenityCount; a++) {
            const am = AMENITIES_POOL[(seed + i + a) % AMENITIES_POOL.length];
            if (!amenities.includes(am)) amenities.push(am);
        }

        results.push({
            id: `hotel-${i}`,
            type: 'hotel',
            name: `${brand.name} ${brand.suffix}`,
            rating: parseFloat(rating),
            reviews: 50 + Math.floor(seededRandom(seed + i * 31) * 450),
            location: formData.destination || 'City Center',
            price,
            image: `https://source.unsplash.com/800x600/?hotel,room&sig=${seed + i}`,
            amenities,
            tier: brand.tier,
        });
    }

    results.forEach(r => {
        r.score = scoreHotelResult(r, results);
    });

    const bestIdx = results.reduce((best, r, i) => r.score > results[best].score ? i : best, 0);
    results[bestIdx].isBest = true;

    return results;
}

export function generateTrainResults(formData, currencyRate = 1) {
    const seed = seededHash(`${formData.origin}-${formData.destination}-${formData.date}-trains`);
    const count = 4 + (seed % 3);
    const results = [];

    for (let i = 0; i < count; i++) {
        const r = seededRandom(seed + i * 7);
        const train = TRAINS[Math.floor(r * TRAINS.length)];

        const timeSlots = [5, 7, 9, 12, 15, 18, 22];
        const depHour = timeSlots[i % timeSlots.length];
        const depMin = Math.floor(seededRandom(seed + i * 13) * 4) * 15;

        // Duration: 4–14h, influenced by speed factor
        const baseDuration = 240 + Math.floor(seededRandom(seed + i * 17) * 480);
        const durationMinutes = Math.round(baseDuration / train.speedFactor);
        const arrHour = (depHour + Math.floor(durationMinutes / 60)) % 24;
        const arrMin = (depMin + durationMinutes % 60) % 60;

        // Pricing: class-based
        const classBase = { premium: 35, 'mid-range': 20, budget: 10 };
        const basePrice = classBase[train.class] || 20;
        const price = Math.round((basePrice + Math.floor(durationMinutes * 0.04)) * currencyRate);

        results.push({
            id: `train-${i}`,
            type: 'train',
            name: train.name,
            number: 10000 + (seed + i * 3) % 70000,
            depTime: `${depHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`,
            arrTime: `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`,
            duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
            durationMinutes,
            price,
            seats: 5 + Math.floor(seededRandom(seed + i * 37) * 45),
            class: formData.trainClass || 'SL',
            trainTier: train.class,
        });
    }

    results.forEach(r => {
        r.score = scoreTrainResult(r, results);
    });

    const bestIdx = results.reduce((best, r, i) => r.score > results[best].score ? i : best, 0);
    results[bestIdx].isBest = true;

    return results;
}

/**
 * Sort results by the selected sort mode.
 * 'recommended' sorts by composite score (descending).
 */
export function sortResults(results, sortBy) {
    return [...results].sort((a, b) => {
        switch (sortBy) {
            case 'price_low': return a.price - b.price;
            case 'price_high': return b.price - a.price;
            case 'rating': return (b.rating || 0) - (a.rating || 0);
            case 'recommended':
            default: return (b.score || 0) - (a.score || 0);
        }
    });
}
