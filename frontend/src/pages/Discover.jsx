import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Heart, ArrowUpRight } from 'lucide-react';
import { searchDestinations, getCuratedDestinations } from '../api/places';
import { Link } from 'react-router-dom';
import BudgetSelectionModal from '../components/ui/BudgetSelectionModal';
import LocationInput from '../components/ui/LocationInput';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';
import useFavourites from '../hooks/useFavourites';

// Premium Destination Card - Bento Box Style
const DestinationCard = ({ dest, index, isFav, onToggleFav }) => {
    const [imgUrl, setImgUrl] = useState(dest.image || null);

    useEffect(() => {
        if (!dest.image) {
            loadDestinationImage(dest.name, setImgUrl);
        }
    }, [dest.name, dest.image]);

    const fallback = getFallbackImage(dest.name);
    
    // Bento box logic: Make every 1st and 4th card span 2 columns on large screens
    const isLarge = index === 0 || index === 3 || index === 6;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative bg-slate-100 dark:bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden ${
                isLarge ? 'md:col-span-2 aspect-[16/10] md:aspect-[21/9]' : 'col-span-1 aspect-[4/5]'
            } shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-700`}
        >
            {/* Image Container with Smooth Parallax Hover */}
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[2.5rem]">
                <img
                    src={imgUrl || fallback}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover transform scale-105 group-hover:scale-110 group-hover:translate-x-[-1%] transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                />
            </div>
            
            {/* Very subtle overall dark tint for image contrast */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-700 pointer-events-none" />

            {/* Top Right Heart Button - Floating Glass */}
            <div className="absolute top-6 right-6 z-20">
                <button
                    onClick={(e) => { e.preventDefault(); onToggleFav(dest); }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-500 hover:scale-110 ${
                        isFav 
                        ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30' 
                        : 'bg-white/10 border border-white/20 text-white/90 hover:bg-white/30 hover:border-white/40'
                    }`}
                >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>
            </div>

            {/* Top Left Rating - Floating Glass */}
            <div className="absolute top-6 left-6 z-20">
                <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white text-sm font-bold flex items-center gap-1.5 shadow-xl">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {dest.rating || 'New'}
                </div>
            </div>

            {/* Bottom Content - Frosted Glass Capsule inside the card */}
            <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6 z-20">
                <div className="relative overflow-hidden rounded-[2rem] p-5 md:p-6 backdrop-blur-3xl bg-white/15 dark:bg-black/30 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] transform translate-y-3 group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    {/* Inner highlight for glassmorphism */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                    
                    <div className="relative flex justify-between items-end">
                        <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 truncate drop-shadow-md tracking-tight">
                                {dest.name}
                            </h3>
                            <div className="flex items-center text-white/90 text-sm font-medium tracking-wide">
                                <MapPin className="w-4 h-4 mr-1.5 opacity-80" />
                                <span className="truncate">{dest.location || dest.country}</span>
                            </div>
                        </div>
                        <Link
                            to={`/destination/${dest.id}`}
                            className="w-12 h-12 rounded-full bg-white dark:bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 hover:bg-primary-50 transition-all duration-300 shadow-xl group/btn"
                        >
                            <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Link>
                    </div>
                    
                    {/* Tags row, slides up on hover */}
                    <div className="mt-0 h-0 opacity-0 overflow-hidden group-hover:h-auto group-hover:mt-5 group-hover:opacity-100 transition-all duration-500 ease-out flex items-center gap-2 flex-wrap">
                        {dest.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wider uppercase border border-white/10 shadow-sm">
                                {tag}
                            </span>
                        ))}
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

    // Title animation variants
    const titleVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }
        })
    };

    const titleWords = "The world is yours to explore.".split(" ");

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] transition-colors duration-500">
            
            {/* Cinematic Hero Section */}
            <div className="relative pt-40 pb-32 px-4 flex flex-col items-center justify-center min-h-[75vh] overflow-hidden">
                {/* Immersive Mesh Gradient Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    {/* Light/Dark mode reactive blobs */}
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-blue-300/40 dark:bg-blue-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob" />
                    <div className="absolute top-[10%] right-[-10%] w-[50%] h-[60%] bg-purple-300/40 dark:bg-purple-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
                    <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[60%] bg-emerald-300/40 dark:bg-emerald-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
                    
                    {/* Noise texture for premium feel */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] dark:opacity-[0.03] mix-blend-overlay" />
                </div>

                <div className="relative z-10 w-full max-w-5xl mx-auto text-center mt-10">
                    {/* Staggered Word Reveal */}
                    <div className="mb-8 flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {titleWords.map((word, i) => (
                            <motion.span
                                key={i}
                                custom={i}
                                initial="hidden"
                                animate="visible"
                                variants={titleVariants}
                                className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm"
                            >
                                {word}
                            </motion.span>
                        ))}
                    </div>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1.5 }}
                        className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-16 font-medium max-w-2xl mx-auto"
                    >
                        Curated experiences and hidden gems across the globe, tailored to your personal aesthetic.
                    </motion.p>

                    {/* Oversized Premium Search */}
                    <motion.form 
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        onSubmit={handleSearch} 
                        className="relative max-w-2xl mx-auto group"
                    >
                        {/* Glow effect behind search bar */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 dark:from-blue-500/20 dark:to-purple-500/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-300" />
                        
                        <div className="relative z-20">
                            <LocationInput
                                value={query}
                                onChange={(val) => setQuery(val)}
                                placeholder="Where to next?"
                                icon={Search}
                                variant="glass"
                                className="w-full text-lg"
                            />
                        </div>
                        <button type="submit" className="hidden" />
                    </motion.form>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-[1400px] mx-auto px-6 pb-32 relative z-20">
                
                {/* Segmented Glass Filters */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="sticky top-28 z-40 flex justify-center mb-16"
                >
                    <div className="inline-flex items-center p-2 bg-white/70 dark:bg-[#111]/70 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-x-auto no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className="relative px-8 py-3.5 rounded-[1.5rem] text-sm md:text-base font-bold tracking-wide transition-colors whitespace-nowrap outline-none"
                            >
                                {filter === cat && (
                                    <motion.div
                                        layoutId="activeFilter"
                                        className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-white/5"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={`relative z-10 ${filter === cat ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                    {cat}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Bento Grid Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <motion.div 
                                    key={`skeleton-${i}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`bg-slate-200/50 dark:bg-zinc-800/50 rounded-[2.5rem] animate-pulse ${
                                        i === 1 || i === 4 ? 'md:col-span-2 aspect-[16/10] md:aspect-[21/9]' : 'col-span-1 aspect-[4/5]'
                                    }`}
                                />
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
                                <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <Search className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">No worlds found</h3>
                                <p className="text-slate-500 text-lg max-w-md">We couldn't find any destinations matching your criteria. Try exploring 'All' to get inspired.</p>
                            </motion.div>
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
