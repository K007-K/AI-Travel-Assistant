import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Heart } from 'lucide-react';
import { searchDestinations, getCuratedDestinations } from '../api/places';
import { Link } from 'react-router-dom';
import BudgetSelectionModal from '../components/ui/BudgetSelectionModal';
import LocationInput from '../components/ui/LocationInput';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';
import useFavourites from '../hooks/useFavourites';

// Minimalist Editorial Card
const DestinationCard = ({ dest, index, isFav, onToggleFav }) => {
    const [imgUrl, setImgUrl] = useState(dest.image || null);

    useEffect(() => {
        if (!dest.image) {
            loadDestinationImage(dest.name, setImgUrl);
        }
    }, [dest.name, dest.image]);

    const fallback = getFallbackImage(dest.name);
    
    // Asymmetrical layout: Make every 1st and 6th card span 2 columns on large screens
    const isLarge = index === 0 || index === 5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`group flex flex-col ${isLarge ? 'md:col-span-2' : 'col-span-1'}`}
        >
            <Link to={`/destination/${dest.id}`} className="block relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-900 shadow-sm" style={{ aspectRatio: isLarge ? '16/9' : '4/5' }}>
                <img
                    src={imgUrl || fallback}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-[1.5s] group-hover:scale-[1.03] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                />
                
                {/* Minimalist Top Right Heart Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleFav(dest); }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isFav 
                            ? 'bg-red-500 text-white shadow-md' 
                            : 'bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-black hover:border-transparent'
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Minimalist Top Left Rating */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <div className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {dest.rating || 'New'}
                    </div>
                </div>
            </Link>

            {/* Clean, editorial content below the image */}
            <div className="pt-5 pb-2">
                <div className="flex justify-between items-start mb-1">
                    <Link to={`/destination/${dest.id}`} className="block">
                        <h3 className="text-xl md:text-2xl font-display font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight">
                            {dest.name}
                        </h3>
                    </Link>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 shrink-0">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        <span>{dest.location || dest.country}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                    {dest.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            {tag}
                        </span>
                    ))}
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
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
            
            {/* Minimalist Hero Section */}
            <div className="pt-32 md:pt-48 pb-20 md:pb-28 px-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-4xl mx-auto text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-7xl lg:text-8xl font-display font-semibold text-slate-900 dark:text-white tracking-tight mb-6"
                    >
                        The world is yours<br className="hidden md:block" /> to explore.
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 font-normal max-w-2xl mx-auto leading-relaxed"
                    >
                        Curated experiences and hidden gems across the globe, perfectly tailored to your personal aesthetic.
                    </motion.p>
                    
                    {/* Clean Search Input */}
                    <motion.form 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        onSubmit={handleSearch} 
                        className="max-w-2xl mx-auto"
                    >
                        <LocationInput
                            value={query}
                            onChange={(val) => setQuery(val)}
                            placeholder="Where to next?"
                            icon={Search}
                            variant="minimalist"
                        />
                        <button type="submit" className="hidden" />
                    </motion.form>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1400px] mx-auto px-6 pb-32">
                
                {/* Minimalist Horizontal Filters */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex items-center justify-start md:justify-center gap-8 overflow-x-auto no-scrollbar pb-4 mb-12 border-b border-slate-100 dark:border-slate-800/50"
                >
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`relative pb-4 text-sm md:text-base font-semibold whitespace-nowrap transition-colors outline-none ${
                                filter === cat 
                                ? 'text-slate-900 dark:text-white' 
                                : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                        >
                            {cat}
                            {filter === cat && (
                                <motion.div
                                    layoutId="minimal-active"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Editorial Grid Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <motion.div 
                                    key={`skeleton-${i}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex flex-col ${i === 1 || i === 6 ? 'md:col-span-2' : 'col-span-1'}`}
                                >
                                    <div className={`bg-slate-100 dark:bg-zinc-800/50 rounded-2xl animate-pulse ${i === 1 || i === 6 ? 'aspect-[16/9]' : 'aspect-[4/5]'}`} />
                                    <div className="pt-5 pb-2">
                                        <div className="h-6 w-3/4 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse mb-3" />
                                        <div className="h-4 w-1/2 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
                                    </div>
                                </motion.div>
                            ))
                        ) : filteredDestinations.length > 0 ? (
                            filteredDestinations.map((dest, index) => (
                                <DestinationCard key={dest.id || index} dest={dest} index={index} isFav={isFavourite(dest.id)} onToggleFav={toggleFavourite} />
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="col-span-full flex flex-col items-center justify-center py-32 text-center"
                            >
                                <div className="w-20 h-20 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center mb-6">
                                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-2xl font-display font-semibold text-slate-900 dark:text-white mb-2">No destinations found</h3>
                                <p className="text-slate-500 text-lg max-w-sm">Try exploring a different category or search term.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <BudgetSelectionModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                destination={selectedDestination}
            />
        </div>
    );
};

export default Discover;
