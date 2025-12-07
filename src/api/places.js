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
        image: 'https://images.unsplash.com/photo-1624614238714-22b37651817a?w=800&q=80',
        rating: 4.8,
        tags: ['Nature', 'Coffee', 'Tribal']
    },
    {
        id: 'd2',
        name: 'Kyoto',
        country: 'Japan',
        location: 'Kyoto Prefecture, Japan',
        description: 'Famous for its numerous classical Buddhist temples, as well as gardens, imperial palaces, Shinto shrines and traditional wooden houses.',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
        rating: 4.9,
        tags: ['Culture', 'History', 'Food']
    },
    {
        id: 'd3',
        name: 'Santorini',
        country: 'Greece',
        location: 'Cyclades, Greece',
        description: 'One of the Cyclades islands in the Aegean Sea. It was devastated by a volcanic eruption in the 16th century BC, forever shaping its rugged landscape.',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
        rating: 4.9,
        tags: ['Beach', 'Romance', 'Views']
    },
    {
        id: 'd4',
        name: 'Machu Picchu',
        country: 'Peru',
        location: 'Cusco Region, Peru',
        description: 'Incan citadel set high in the Andes Mountains in Peru, above the Urubamba River valley.',
        image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80',
        rating: 5.0,
        tags: ['History', 'Adventure', 'Hiking']
    },
    {
        id: 'd5',
        name: 'Ladakh',
        country: 'India',
        location: 'Ladakh, India',
        description: 'A region in the Indian state of Jammu and Kashmir that currently extends from the Siachen Glacier in the Karakoram range to the main Great Himalayas.',
        image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&q=80',
        rating: 4.7,
        tags: ['Adventure', 'Mountains', 'Culture']
    }
];
