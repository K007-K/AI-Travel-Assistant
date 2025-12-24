import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Filter, Heart, ChevronRight } from 'lucide-react';
import { searchDestinations, getCuratedDestinations } from '../api/places';
import { Link } from 'react-router-dom';
import BudgetSelectionModal from '../components/ui/BudgetSelectionModal';
import LocationInput from '../components/ui/LocationInput'; // [NEW]

const Discover = () => {
    const [query, setQuery] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState(null);

    useEffect(() => {
        // Load initial curated destinations
        setDestinations(getCuratedDestinations());
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) {
            setDestinations(getCuratedDestinations());
            return;
        }

        setIsLoading(true);
        try {
            // Mock search mostly for curated feels better, but we can mix or just use curated for now
            // if user wants real search, we use the API
            const results = await searchDestinations(query);
            // Fallback to curated filter if API returns nothing useful/no images (since mock images might fail)
            // But let's try to mix or just show results
            setDestinations(results.length > 0 ? results : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const categories = ['All', 'Nature', 'Culture', 'Beach', 'Adventure', 'City'];

    const filteredDestinations = filter === 'All'
        ? destinations
        : destinations.filter(d => d.tags?.includes(filter) || d.type?.includes(filter.toLowerCase()));

    return (
        <div className="min-h-screen pt-20 pb-12 bg-slate-50 dark:bg-slate-900">
            <div className="bg-primary-600 pb-24 pt-10 px-4 mb-[-60px]">
                <div className="container-custom text-center text-white">
                    <h1 className="text-4xl font-display font-bold mb-4">Discover Your Next Adventure</h1>
                    <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-8">
                        Explore curated destinations, hidden gems, and local experiences around the globe.
                    </p>

                    <form onSubmit={handleSearch} className="max-w-xl mx-auto relative px-4 text-left">
                        <LocationInput
                            value={query}
                            onChange={(val) => setQuery(val)}
                            placeholder="Search destinations, countries, or activities..."
                            icon={Search}
                            className="w-full text-slate-900"
                        />
                        {/* Hidden submit button to allow Enter key */}
                        <button type="submit" className="hidden" />
                    </form>
                </div>
            </div>

            <div className="container-custom">
                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar justify-center">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${filter === cat
                                ? 'bg-primary-500 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl h-64 mb-4" />
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                </div>
                            ))
                        ) : filteredDestinations.length > 0 ? (
                            filteredDestinations.map((dest, index) => (
                                <motion.div
                                    key={dest.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800"
                                >
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={dest.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(dest.name)}`}
                                            alt={dest.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-red-500 transition-colors">
                                            <Heart className="w-5 h-5" />
                                        </button>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                {dest.rating || 'New'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{dest.name}</h3>
                                        <div className="flex items-center text-slate-500 mb-4 text-sm">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            {dest.location || dest.country}
                                        </div>

                                        {dest.description && (
                                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                                                {dest.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {dest.tags?.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedDestination(dest);
                                                setIsBudgetModalOpen(true);
                                            }}
                                            className="btn btn-outline w-full flex items-center justify-center gap-2 group-hover:bg-primary-50 dark:group-hover:bg-primary-950"
                                        >
                                            Explore Details <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20">
                                <p className="text-slate-500 text-lg">No destinations found matching your search.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Budget Selection Modal */}
            <BudgetSelectionModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                destination={selectedDestination}
            />
        </div>
    );
};

export default Discover;
