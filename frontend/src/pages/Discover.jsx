import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Filter, Heart, ChevronRight } from 'lucide-react';
import { searchDestinations, getCuratedDestinations } from '../api/places';
import { Link } from 'react-router-dom';
import BudgetSelectionModal from '../components/ui/BudgetSelectionModal';
import LocationInput from '../components/ui/LocationInput';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';
import useFavourites from '../hooks/useFavourites';

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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="group relative bg-white dark:bg-[#141414] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 border border-slate-100 dark:border-white/5 flex flex-col h-[380px]"
        >
            <div className="relative h-full w-full overflow-hidden">
                <img
                    src={imgUrl || fallback}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                
                <button
                    onClick={(e) => { e.preventDefault(); onToggleFav(dest); }}
                    className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 transform z-10 ${
                        isFav 
                        ? 'bg-red-500/90 text-white scale-100' 
                        : 'bg-black/20 text-white/90 hover:bg-white hover:text-red-500 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0'
                    }`}
                >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                </button>
                
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end transform transition-transform duration-500 translate-y-[70px] group-hover:translate-y-0">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1.5 drop-shadow-sm font-display tracking-wide">{dest.name}</h3>
                            <div className="flex items-center text-white/80 text-xs font-medium uppercase tracking-wider">
                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                <span className="truncate max-w-[140px]">{dest.location || dest.country}</span>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            {dest.rating || 'New'}
                        </span>
                    </div>

                    <p className="text-white/70 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 leading-relaxed">
                        {dest.description || 'Discover this amazing destination.'}
                    </p>

                    <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 transform translate-y-4 group-hover:translate-y-0">
                        <div className="flex gap-1.5 overflow-hidden">
                            {dest.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-white/90 text-[10px] font-bold tracking-wider uppercase border border-white/10">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <Link
                            to={`/destination/${dest.id}`}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors shadow-lg"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
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
        <div className="min-h-screen pb-12 bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            {/* Premium Immersive Hero */}
            <div className="relative pt-32 pb-24 px-4 overflow-hidden mb-12">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 z-0" />
                {/* Subtle animated glowing orbs / abstract blobs in the background */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-primary-600/20 blur-[120px] rounded-full z-0" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[70%] bg-blue-500/20 blur-[100px] rounded-full z-0" />

                <div className="container-custom relative z-10 text-center text-white">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight drop-shadow-lg">
                            Discover Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400">Next Adventure</span>
                        </h1>
                        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                            Explore curated destinations, hidden gems, and local experiences around the globe tailored to your style.
                        </p>
                    </motion.div>

                    <motion.form 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        onSubmit={handleSearch} 
                        className="max-w-2xl mx-auto relative px-4 text-left"
                    >
                        <LocationInput
                            value={query}
                            onChange={(val) => setQuery(val)}
                            placeholder="Search destinations, countries, or activities..."
                            icon={Search}
                            variant="glass"
                            className="w-full"
                        />
                        {/* Hidden submit button to allow Enter key */}
                        <button type="submit" className="hidden" />
                    </motion.form>
                </div>
                
                {/* Gradient fade to background color */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
            </div>

            <div className="container-custom relative z-20 mt-[-60px]">
                {/* Categories */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex gap-3 overflow-x-auto pb-6 mb-8 no-scrollbar justify-center px-4"
                >
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-7 py-2.5 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 shadow-sm border ${
                                filter === cat
                                ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white border-transparent shadow-primary-500/25 scale-105'
                                : 'bg-white/80 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md hover:scale-105'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </motion.div>

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
