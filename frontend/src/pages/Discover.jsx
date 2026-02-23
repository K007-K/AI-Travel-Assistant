import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Filter, Heart, ChevronRight } from 'lucide-react';
import { searchDestinations, getCuratedDestinations } from '../api/places';
import { Link } from 'react-router-dom';
import BudgetSelectionModal from '../components/ui/BudgetSelectionModal';
import LocationInput from '../components/ui/LocationInput';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';
import useFavourites from '../hooks/useFavourites';

/* ─── Destination Card with lazy image loading ───────────────── */
const DestinationCard = ({ dest, index, isFav, onToggleFav }) => {
    const [imgUrl, setImgUrl] = useState(dest.image || null);

    useEffect(() => {
        if (!dest.image) {
            loadDestinationImage(dest.name, setImgUrl);
        }
    }, [dest.name, dest.image]);

    const fallback = getFallbackImage(dest.name);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white dark:bg-white/[0.03] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 flex flex-col h-full"
        >
            <div className="relative h-40 overflow-hidden flex-shrink-0">
                <img
                    src={imgUrl || fallback}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button
                    onClick={(e) => { e.preventDefault(); onToggleFav(dest); }}
                    className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                        isFav ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white hover:text-red-500'
                    }`}
                >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {dest.rating || 'New'}
                    </span>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5 truncate">{dest.name}</h3>
                <div className="flex items-center text-slate-500 mb-2 text-xs">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{dest.location || dest.country}</span>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 mb-3 min-h-[2rem] leading-relaxed">
                    {dest.description || 'Discover this amazing destination.'}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
                    {dest.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="mt-auto">
                    <Link
                        to={`/destination/${dest.id}`}
                        className="btn btn-outline w-full flex items-center justify-center gap-1.5 text-xs py-2 group-hover:bg-primary-50 dark:group-hover:bg-primary-950"
                    >
                        Explore Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

const Discover = () => {
    const [query, setQuery] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [selectedDestination, _setSelectedDestination] = useState(null);
    const { isFavourite, toggleFavourite } = useFavourites();

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
            const results = await searchDestinations(query);
            // Cache each result in sessionStorage so DestinationDetail can find them
            results.forEach(d => {
                try { sessionStorage.setItem(`dest_${d.id}`, JSON.stringify(d)); } catch { /* ignore quota errors */ }
            });
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
        <div className="min-h-screen pt-20 pb-12 bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300">
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
                                : 'bg-white dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                                <DestinationCard key={dest.id || index} dest={dest} index={index} isFav={isFavourite(dest.id)} onToggleFav={toggleFavourite} />
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
