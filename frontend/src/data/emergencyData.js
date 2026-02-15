/**
 * Static emergency contact data by country.
 * NO AI, NO hallucination — verified official numbers.
 *
 * Source: International SOS, local government sites.
 * Last updated: February 2026
 */

export const EMERGENCY_DATA = {
    india: {
        country: 'India',
        flag: '🇮🇳',
        police: '100',
        ambulance: '108',
        fire: '101',
        women_helpline: '1091',
        tourist_helpline: '1363',
        universal: '112',
    },
    usa: {
        country: 'United States',
        flag: '🇺🇸',
        police: '911',
        ambulance: '911',
        fire: '911',
        universal: '911',
    },
    uk: {
        country: 'United Kingdom',
        flag: '🇬🇧',
        police: '999',
        ambulance: '999',
        fire: '999',
        universal: '999',
    },
    france: {
        country: 'France',
        flag: '🇫🇷',
        police: '17',
        ambulance: '15',
        fire: '18',
        universal: '112',
    },
    germany: {
        country: 'Germany',
        flag: '🇩🇪',
        police: '110',
        ambulance: '112',
        fire: '112',
        universal: '112',
    },
    japan: {
        country: 'Japan',
        flag: '🇯🇵',
        police: '110',
        ambulance: '119',
        fire: '119',
        universal: '110',
    },
    australia: {
        country: 'Australia',
        flag: '🇦🇺',
        police: '000',
        ambulance: '000',
        fire: '000',
        universal: '000',
    },
    canada: {
        country: 'Canada',
        flag: '🇨🇦',
        police: '911',
        ambulance: '911',
        fire: '911',
        universal: '911',
    },
    thailand: {
        country: 'Thailand',
        flag: '🇹🇭',
        police: '191',
        ambulance: '1669',
        fire: '199',
        tourist_police: '1155',
        universal: '191',
    },
    singapore: {
        country: 'Singapore',
        flag: '🇸🇬',
        police: '999',
        ambulance: '995',
        fire: '995',
        universal: '999',
    },
    uae: {
        country: 'United Arab Emirates',
        flag: '🇦🇪',
        police: '999',
        ambulance: '998',
        fire: '997',
        universal: '999',
    },
    italy: {
        country: 'Italy',
        flag: '🇮🇹',
        police: '113',
        ambulance: '118',
        fire: '115',
        universal: '112',
    },
    spain: {
        country: 'Spain',
        flag: '🇪🇸',
        police: '091',
        ambulance: '061',
        fire: '080',
        universal: '112',
    },
    mexico: {
        country: 'Mexico',
        flag: '🇲🇽',
        police: '911',
        ambulance: '911',
        fire: '911',
        universal: '911',
    },
    brazil: {
        country: 'Brazil',
        flag: '🇧🇷',
        police: '190',
        ambulance: '192',
        fire: '193',
        universal: '190',
    },
    south_korea: {
        country: 'South Korea',
        flag: '🇰🇷',
        police: '112',
        ambulance: '119',
        fire: '119',
        universal: '112',
    },
    china: {
        country: 'China',
        flag: '🇨🇳',
        police: '110',
        ambulance: '120',
        fire: '119',
        universal: '110',
    },
    indonesia: {
        country: 'Indonesia',
        flag: '🇮🇩',
        police: '110',
        ambulance: '118',
        fire: '113',
        universal: '112',
    },
    vietnam: {
        country: 'Vietnam',
        flag: '🇻🇳',
        police: '113',
        ambulance: '115',
        fire: '114',
        universal: '113',
    },
    turkey: {
        country: 'Turkey',
        flag: '🇹🇷',
        police: '155',
        ambulance: '112',
        fire: '110',
        universal: '112',
    },
    egypt: {
        country: 'Egypt',
        flag: '🇪🇬',
        police: '122',
        ambulance: '123',
        fire: '180',
        tourist_police: '126',
        universal: '122',
    },
    south_africa: {
        country: 'South Africa',
        flag: '🇿🇦',
        police: '10111',
        ambulance: '10177',
        fire: '10177',
        universal: '112',
    },
    malaysia: {
        country: 'Malaysia',
        flag: '🇲🇾',
        police: '999',
        ambulance: '999',
        fire: '994',
        universal: '999',
    },
    philippines: {
        country: 'Philippines',
        flag: '🇵🇭',
        police: '911',
        ambulance: '911',
        fire: '911',
        universal: '911',
    },
    switzerland: {
        country: 'Switzerland',
        flag: '🇨🇭',
        police: '117',
        ambulance: '144',
        fire: '118',
        universal: '112',
    },
    netherlands: {
        country: 'Netherlands',
        flag: '🇳🇱',
        police: '112',
        ambulance: '112',
        fire: '112',
        universal: '112',
    },
    portugal: {
        country: 'Portugal',
        flag: '🇵🇹',
        police: '112',
        ambulance: '112',
        fire: '112',
        universal: '112',
    },
    greece: {
        country: 'Greece',
        flag: '🇬🇷',
        police: '100',
        ambulance: '166',
        fire: '199',
        tourist_police: '171',
        universal: '112',
    },
    russia: {
        country: 'Russia',
        flag: '🇷🇺',
        police: '102',
        ambulance: '103',
        fire: '101',
        universal: '112',
    },
    new_zealand: {
        country: 'New Zealand',
        flag: '🇳🇿',
        police: '111',
        ambulance: '111',
        fire: '111',
        universal: '111',
    },
    sri_lanka: {
        country: 'Sri Lanka',
        flag: '🇱🇰',
        police: '119',
        ambulance: '110',
        fire: '110',
        universal: '119',
    },
    nepal: {
        country: 'Nepal',
        flag: '🇳🇵',
        police: '100',
        ambulance: '102',
        fire: '101',
        universal: '100',
    },
};

/**
 * Find emergency data for a destination string.
 * Matches country keywords in the destination.
 *
 * @param {string} destination — Trip destination (e.g., "Paris, France")
 * @returns {object|null} — Emergency contacts or null
 */
export function findEmergencyData(destination) {
    if (!destination) return null;
    const lower = destination.toLowerCase();

    // Direct key match
    for (const [key, data] of Object.entries(EMERGENCY_DATA)) {
        if (lower.includes(key.replace('_', ' ')) || lower.includes(data.country.toLowerCase())) {
            return data;
        }
    }

    // City → country mapping (common cities)
    const CITY_COUNTRY_MAP = {
        paris: 'france', lyon: 'france', nice: 'france', marseille: 'france',
        london: 'uk', manchester: 'uk', edinburgh: 'uk', birmingham: 'uk',
        'new york': 'usa', 'los angeles': 'usa', chicago: 'usa', miami: 'usa', 'san francisco': 'usa', 'las vegas': 'usa',
        tokyo: 'japan', osaka: 'japan', kyoto: 'japan',
        berlin: 'germany', munich: 'germany', hamburg: 'germany', frankfurt: 'germany',
        rome: 'italy', florence: 'italy', venice: 'italy', milan: 'italy', naples: 'italy',
        barcelona: 'spain', madrid: 'spain', valencia: 'spain', seville: 'spain',
        sydney: 'australia', melbourne: 'australia', brisbane: 'australia',
        toronto: 'canada', vancouver: 'canada', montreal: 'canada',
        bangkok: 'thailand', phuket: 'thailand', 'chiang mai': 'thailand', pattaya: 'thailand',
        dubai: 'uae', 'abu dhabi': 'uae',
        seoul: 'south_korea', busan: 'south_korea',
        beijing: 'china', shanghai: 'china', guangzhou: 'china',
        'kuala lumpur': 'malaysia', penang: 'malaysia',
        bali: 'indonesia', jakarta: 'indonesia',
        'ho chi minh': 'vietnam', hanoi: 'vietnam',
        istanbul: 'turkey', cappadocia: 'turkey', antalya: 'turkey',
        cairo: 'egypt', luxor: 'egypt',
        lisbon: 'portugal', porto: 'portugal',
        athens: 'greece', santorini: 'greece', mykonos: 'greece',
        zurich: 'switzerland', geneva: 'switzerland',
        amsterdam: 'netherlands', rotterdam: 'netherlands',
        moscow: 'russia', 'saint petersburg': 'russia',
        auckland: 'new_zealand', queenstown: 'new_zealand',
        manila: 'philippines', cebu: 'philippines',
        'cape town': 'south_africa', johannesburg: 'south_africa',
        colombo: 'sri_lanka', kandy: 'sri_lanka',
        kathmandu: 'nepal', pokhara: 'nepal',
        // Indian cities
        delhi: 'india', mumbai: 'india', bangalore: 'india', bengaluru: 'india',
        chennai: 'india', kolkata: 'india', hyderabad: 'india', pune: 'india',
        jaipur: 'india', goa: 'india', varanasi: 'india', agra: 'india',
        kochi: 'india', udaipur: 'india', shimla: 'india', manali: 'india',
        rishikesh: 'india', darjeeling: 'india', leh: 'india', ladakh: 'india',
        visakhapatnam: 'india', vizag: 'india', mysore: 'india', ooty: 'india',
        pondicherry: 'india', amritsar: 'india', lucknow: 'india', ahmedabad: 'india',
    };

    for (const [city, countryKey] of Object.entries(CITY_COUNTRY_MAP)) {
        if (lower.includes(city)) {
            return EMERGENCY_DATA[countryKey] || null;
        }
    }

    // EU default (112 works across EU)
    return null;
}
