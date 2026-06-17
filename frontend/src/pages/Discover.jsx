// Discover page — Apple-minimal light theme with vertical scroll layout
import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, Star, Heart, ArrowRight } from 'lucide-react';
import { searchDestinations, getCuratedDestinations } from '../api/places';
import { Link } from 'react-router-dom';
import LocationInput from '../components/ui/LocationInput';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';
import useFavourites from '../hooks/useFavourites';

/* ─── Destination Card (grid item) ──────────────────────────────── */
const DestinationCard = ({ dest, isFav, onToggleFav, index }) => {
    const [imgUrl, setImgUrl] = useState(dest.image || null);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        setImgUrl(dest.image || null);
        if (!dest.image) {
            loadDestinationImage(dest.name, setImgUrl);
        }
    }, [dest.name, dest.image]);

    const fallback = getFallbackImage(dest.name);

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
        >
            <Link
                to={`/destination/${dest.id}`}
                className="group block"
                id={`discover-card-${dest.id}`}
            >
                {/* Image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F5F5F7] mb-4">
                    <img
                        src={imgUrl || fallback}
                        alt={dest.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                    />
                    {/* Favourite button */}
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(dest); }}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isFav
                            ? 'bg-[#FF3B30] text-white shadow-md'
                            : 'bg-white/80 backdrop-blur-sm text-slate-400 hover:text-[#FF3B30] hover:bg-white shadow-sm'
                        }`}
                        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                    >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Text below image */}
                <div className="px-1">
                    <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight group-hover:text-[#0071E3] transition-colors duration-200">
                        {dest.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-[#86868B]">
                            {dest.country}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-[#86868B]">
                            <Star className="w-3.5 h-3.5 fill-[#FF9500] text-[#FF9500]" />
                            {dest.rating}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

/* ─── Featured Destination Card (hero-size) ──────────────────────── */
const FeaturedCard = ({ dest, isFav, onToggleFav }) => {
    const [imgUrl, setImgUrl] = useState(dest.image || null);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        setImgUrl(dest.image || null);
        if (!dest.image) {
            loadDestinationImage(dest.name, setImgUrl);
        }
    }, [dest.name, dest.image]);

    const fallback = getFallbackImage(dest.name);

    return (
        <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
            <Link
                to={`/destination/${dest.id}`}
                className="group block"
                id="discover-featured-card"
            >
                {/* Large image */}
                <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-[#F5F5F7] shadow-[0_2px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-shadow duration-500">
                    <img
                        src={imgUrl || fallback}
                        alt={dest.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    {/* Favourite */}
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(dest); }}
                        className={`absolute top-5 right-5 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isFav
                            ? 'bg-[#FF3B30] text-white shadow-lg'
                            : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-[#FF3B30] shadow-md'
                        }`}
                        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                    >
                        <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Text below image */}
                <div className="mt-5 flex items-start justify-between px-1">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-[#1D1D1F] tracking-tight group-hover:text-[#0071E3] transition-colors duration-200">
                            {dest.name}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[#86868B] text-base">{dest.country}</span>
                            <span className="w-1 h-1 rounded-full bg-[#D1D1D6]" />
                            <span className="flex items-center gap-1 text-[#86868B] text-base">
                                <Star className="w-4 h-4 fill-[#FF9500] text-[#FF9500]" />
                                {dest.rating}
                            </span>
                            {dest.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className="text-xs text-[#86868B] uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[#0071E3] font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
                        Explore <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN DISCOVER PAGE
   ═══════════════════════════════════════════════════════════════════ */
const Discover = () => {
    const [query, setQuery] = useState('');
    const [destinations, setDestinations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const { isFavourite, toggleFavourite } = useFavourites();
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        setDestinations(getCuratedDestinations());
    }, []);

    // Trigger search — called on form submit AND when user selects a suggestion
    const runSearch = async (searchQuery) => {
        const q = searchQuery || query;
        if (!q.trim()) {
            setDestinations(getCuratedDestinations());
            return;
        }

        setFilter('All'); // Reset filter so results aren't hidden
        setIsLoading(true);
        try {
            const results = await searchDestinations(q);
            results.forEach(d => {
                try { sessionStorage.setItem(`dest_${d.id}`, JSON.stringify(d)); } catch { /* ignore quota errors */ }
            });
            setDestinations(results.length > 0 ? results : []);
        } catch (err) {
            console.error('[Discover] Search failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        await runSearch();
    };

    const handleLocationSelect = (val) => {
        setQuery(val);
        runSearch(val);
    };

    const categories = ['All', 'Nature', 'Culture', 'Beach', 'Adventure', 'City'];

    const filteredDestinations = filter === 'All'
        ? destinations
        : destinations.filter(d => d.tags?.includes(filter) || d.type?.includes(filter.toLowerCase()));

    // Pick a random featured destination (stable per render via useMemo)
    const featuredDest = useMemo(() => {
        if (filteredDestinations.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * filteredDestinations.length);
        return filteredDestinations[randomIndex];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredDestinations.length, filter]);

    // Remaining destinations (exclude featured)
    const gridDestinations = filteredDestinations.filter(d => d.id !== featuredDest?.id);

    return (
        <section className="min-h-screen bg-white font-sans selection:bg-[#0071E3]/10" id="discover-page">

            {/* ── HERO ────────────────────────────────────────────── */}
            <div className="pt-36 md:pt-44 pb-12 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.h1
                        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        className="text-6xl md:text-8xl lg:text-[7rem] font-display font-black text-[#1D1D1F] tracking-tight leading-none"
                    >
                        Discover
                    </motion.h1>

                    <motion.p
                        initial={shouldReduceMotion ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="mt-4 text-lg md:text-xl text-[#86868B] max-w-xl mx-auto"
                    >
                        Curated destinations for the curious traveler.
                    </motion.p>

                    {/* Search */}
                    <motion.form
                        initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        onSubmit={handleSearch}
                        className="mt-10 max-w-lg mx-auto"
                    >
                        <LocationInput
                            value={query}
                            onChange={(val) => setQuery(val)}
                            onSelect={handleLocationSelect}
                            placeholder="Search destinations..."
                            icon={Search}
                            variant="minimalist"
                        />
                        <button type="submit" className="hidden" />
                    </motion.form>

                    {/* Category Tabs */}
                    <motion.div
                        initial={shouldReduceMotion ? {} : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                        className="mt-8 flex items-center justify-center gap-8 overflow-x-auto no-scrollbar"
                    >
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`relative pb-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                                    filter === cat
                                    ? 'text-[#1D1D1F]'
                                    : 'text-[#AEAEB2] hover:text-[#86868B]'
                                }`}
                            >
                                {cat}
                                {filter === cat && (
                                    <motion.div
                                        layoutId="category-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D1D1F] rounded-full"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ── CONTENT ─────────────────────────────────────────── */}
            <div className="px-6 pb-24">
                <div className="max-w-6xl mx-auto">

                    {isLoading ? (
                        /* Loading State */
                        <div className="flex items-center justify-center py-32">
                            <div className="w-8 h-8 border-[3px] border-[#E5E5EA] border-t-[#1D1D1F] rounded-full animate-spin" />
                        </div>

                    ) : filteredDestinations.length > 0 ? (
                        <>
                            {/* Featured Card */}
                            {featuredDest && (
                                <div className="mb-16" key={`featured-${featuredDest.id}`}>
                                    <FeaturedCard
                                        key={featuredDest.id}
                                        dest={featuredDest}
                                        isFav={isFavourite(featuredDest.id)}
                                        onToggleFav={toggleFavourite}
                                    />
                                </div>
                            )}

                            {/* Section label */}
                            {gridDestinations.length > 0 && (
                                <motion.div
                                    initial={shouldReduceMotion ? {} : { opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="mb-8"
                                >
                                    <h2 className="text-2xl font-display font-bold text-[#1D1D1F] tracking-tight">
                                        All destinations
                                    </h2>
                                    <p className="text-sm text-[#86868B] mt-1">
                                        {gridDestinations.length} places to explore
                                    </p>
                                </motion.div>
                            )}

                            {/* Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                                {gridDestinations.map((dest, index) => (
                                    <DestinationCard
                                        key={dest.id || index}
                                        dest={dest}
                                        index={index}
                                        isFav={isFavourite(dest.id)}
                                        onToggleFav={toggleFavourite}
                                    />
                                ))}
                            </div>
                        </>

                    ) : (
                        /* Empty State */
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-5">
                                <Search className="w-7 h-7 text-[#AEAEB2]" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">
                                No destinations found
                            </h3>
                            <p className="text-[#86868B] text-base max-w-sm">
                                Try a different search term or browse our curated collections above.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Discover;
