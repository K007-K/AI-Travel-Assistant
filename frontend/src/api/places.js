const PLACE_TYPES = {
    natural: ['beach', 'mountain', 'lake', 'park', 'nature_reserve'],
    cultural: ['museum', 'temple', 'historic_site', 'art_gallery', 'monument'],
    entertainment: ['restaurant', 'cafe', 'bar', 'theatre', 'amusement_park']
};

export const searchDestinations = async (query) => {
    try {
        // Using OpenStreetMap Nominatim API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`
        );
        const data = await response.json();

        // Transform data to our format
        return data.map(item => ({
            id: item.place_id,
            name: item.name || item.display_name.split(',')[0],
            location: item.display_name,
            country: item.address?.country,
            coordinates: [item.lat, item.lon],
            type: item.type,
            // Mocked data since Nominatim doesn't provide images/ratings
            rating: (4 + Math.random()).toFixed(1),
            image: `https://source.unsplash.com/800x600/?${encodeURIComponent(item.name || query)}`
        }));
    } catch (error) {
        console.error("Error searching places:", error);
        return [];
    }
};

export const getCuratedDestinations = () => [
    {
        id: 'd1',
        name: 'Araku Valley',
        country: 'India',
        location: 'Andhra Pradesh, India',
        description: 'A hill station in Visakhapatnam district, known for its coffee plantations and rich tribal culture.',
        image: 'https://images.unsplash.com/photo-1596021688656-35fdc9ed0274?w=800&q=80',
        rating: 4.8,
        tags: ['Nature', 'Coffee', 'Tribal']
    },
    {
        id: 'd2',
        name: 'Visakhapatnam',
        country: 'India',
        location: 'Andhra Pradesh, India',
        description: 'The Jewel of the East Coast. Known for its pristine beaches, submarine museum, and scenic Kailasagiri hill.',
        image: 'https://images.unsplash.com/photo-1594312873175-351e72a4b55b?w=800&q=80',
        rating: 4.7,
        tags: ['Beach', 'Nature', 'City']
    },
    {
        id: 'd3',
        name: 'Tirupati',
        country: 'India',
        location: 'Andhra Pradesh, India',
        description: 'A major pilgrimage city, home to the famous Sri Venkateswara Temple sitting atop one of the seven peaks of Tirumala Hills.',
        image: 'https://images.unsplash.com/photo-1755515957515-a075e22429de?w=800&q=80',
        rating: 4.9,
        tags: ['Spiritual', 'Culture', 'History']
    },
    {
        id: 'd4',
        name: 'New York City',
        country: 'USA',
        location: 'New York, USA',
        description: 'The City That Never Sleeps. Iconic landmarks, world-class museums, and diverse neighborhoods.',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
        rating: 4.8,
        tags: ['City', 'Urban', 'Culture']
    },
    {
        id: 'd5',
        name: 'Banff',
        country: 'Canada',
        location: 'Alberta, Canada',
        description: 'Rocky Mountain peaks, turquoise glacial lakes, a picture-perfect mountain town and abundant wildlife.',
        image: 'https://images.unsplash.com/photo-1755287802880-f2eeb272a3ed?w=800&q=80',
        rating: 4.9,
        tags: ['Nature', 'Hiking', 'Mountains']
    },
    {
        id: 'd6',
        name: 'Dubai',
        country: 'UAE',
        location: 'Dubai, UAE',
        description: 'Known for luxury shopping, ultramodern architecture, and a lively nightlife scene.',
        image: 'https://images.unsplash.com/photo-1550779864-6ccb28702fdb?w=800&q=80',
        rating: 4.7,
        tags: ['Luxury', 'City', 'Desert']
    },
    {
        id: 'd7',
        name: 'Queenstown',
        country: 'New Zealand',
        location: 'Otago, New Zealand',
        description: 'The adventure capital of the world. Bungy jumping, jet boating, skiing, and hiking.',
        image: 'https://plus.unsplash.com/premium_photo-1754337709293-b486b3a9b374?w=800&q=80',
        rating: 4.9,
        tags: ['Adventure', 'Nature', 'Extreme']
    },
    {
        id: 'd8',
        name: 'Mumbai',
        country: 'India',
        location: 'Maharashtra, India',
        description: 'The City of Dreams. Home to the Gateway of India, Bollywood, and vibrant street life.',
        image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80',
        rating: 4.6,
        tags: ['City', 'History', 'Culture']
    },
    {
        id: 'd9',
        name: 'Jaipur',
        country: 'India',
        location: 'Rajasthan, India',
        description: 'The Pink City. Famous for Hawa Mahal, Amer Fort, and its royal heritage.',
        image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80',
        rating: 4.8,
        tags: ['History', 'Culture', 'Architecture']
    },
    {
        id: 'd10',
        name: 'Kerala',
        country: 'India',
        location: 'Kerala, India',
        description: 'God\'s Own Country. Serene backwaters, lush tea plantations, and pristine beaches.',
        image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
        rating: 4.9,
        tags: ['Nature', 'Relaxation', 'Beach']
    },
    {
        id: 'd11',
        name: 'London',
        country: 'UK',
        location: 'England, UK',
        description: 'A 21st-century city with history stretching back to Roman times. Big Ben, London Eye, and more.',
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
        rating: 4.8,
        tags: ['City', 'History', 'Culture']
    },
    {
        id: 'd12',
        name: 'Rome',
        country: 'Italy',
        location: 'Lazio, Italy',
        description: 'The Eternal City. The Colosseum, Roman Forum, and Trevi Fountain await.',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
        rating: 4.8,
        tags: ['History', 'Art', 'Culture']
    },
    {
        id: 'd13',
        name: 'Sydney',
        country: 'Australia',
        location: 'New South Wales, Australia',
        description: 'Harbour city known for the Sydney Opera House, Harbour Bridge, and Bondi Beach.',
        image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
        rating: 4.8,
        tags: ['Beach', 'City', 'Culture']
    },
    {
        id: 'd14',
        name: 'Santorini',
        country: 'Greece',
        location: 'Cyclades, Greece',
        description: 'Famous for its white-washed buildings, blue domes, and stunning sunsets.',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
        rating: 4.9,
        tags: ['Beach', 'Romance', 'Views']
    },
    {
        id: 'd15',
        name: 'Kyoto',
        country: 'Japan',
        location: 'Kyoto Prefecture, Japan',
        description: 'Classical Buddhist temples, gardens, imperial palaces, and Shinto shrines.',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
        rating: 4.9,
        tags: ['Culture', 'History', 'Peace']
    }
];
