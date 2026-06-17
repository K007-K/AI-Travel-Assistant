import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Heart, Navigation } from 'lucide-react';
import { searchDestinations, getCuratedDestinations } from '../api/places';
import { Link } from 'react-router-dom';
import BudgetSelectionModal from '../components/ui/BudgetSelectionModal';
import LocationInput from '../components/ui/LocationInput';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';
import useFavourites from '../hooks/useFavourites';

// Premium Discover Page CSS injected dynamically for modern APIs
const discoverStyles = `
.discover-carousel {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0 50vw; /* Add padding to allow snapping first/last items to center */
}
.discover-carousel::-webkit-scrollbar {
  display: none;
}

/* Offset padding adjustment so the first card snaps perfectly to center */
.discover-carousel::before,
.discover-carousel::after {
  content: '';
  flex: 0 0 calc(50vw - 250px); /* Assuming card width is ~500px, half is 250px */
}

@media (max-width: 768px) {
  .discover-carousel::before,
  .discover-carousel::after {
    flex: 0 0 calc(50vw - 160px); /* Mobile card width ~320px */
  }
}

.discover-carousel-item {
  scroll-snap-align: center;
  container-type: scroll-state;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.discover-card {
  transition: 
    transform 0.8s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  filter: brightness(0.5) saturate(0.6);
  transform: scale(0.85);
  will-change: transform, filter;
}

.discover-card-info {
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0;
  transform: translateY(20px);
}

@media (prefers-reduced-motion: no-preference) {
  @container scroll-state(snapped: x) {
    .discover-card {
      filter: brightness(1) saturate(1.1);
      transform: scale(1.05);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      z-index: 10;
    }
    .discover-card-info {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  }
}

/* JS Fallback for unsupported browsers */
.discover-carousel-item.is-snapped .discover-card {
  filter: brightness(1) saturate(1.1);
  transform: scale(1.05);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  z-index: 10;
}
.discover-carousel-item.is-snapped .discover-card-info {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

/* Scroll-driven Parallax (Native if supported) */
@supports (animation-timeline: view(inline)) {
  .parallax-bg {
    animation: parallax linear;
    animation-timeline: view(inline);
  }
  @keyframes parallax {
    0% { transform: translateX(-15%) scale(1.1); }
    100% { transform: translateX(15%) scale(1.1); }
  }
}
@supports not (animation-timeline: view(inline)) {
  .parallax-bg {
    transform: scale(1.1);
  }
}
`;

const DestinationCard = ({ dest, index, isFav, onToggleFav }) => {
    const [imgUrl, setImgUrl] = useState(dest.image || null);

    useEffect(() => {
        if (!dest.image) {
            loadDestinationImage(dest.name, setImgUrl);
        }
    }, [dest.name, dest.image]);

    const fallback = getFallbackImage(dest.name);

    return (
        <div className="discover-carousel-item px-4 w-[320px] md:w-[500px] h-[500px] md:h-[700px]">
            <Link to={`/destination/${dest.id}`} className="block relative w-full h-full rounded-3xl overflow-hidden bg-zinc-900 discover-card group">
                
                {/* Parallax Image Container */}
                <div className="absolute inset-0 overflow-hidden bg-black">
                    <img
                        src={imgUrl || fallback}
                        alt={dest.name}
                        className="parallax-bg absolute inset-0 w-[130%] h-full object-cover origin-center max-w-none left-[-15%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
                </div>
                
                {/* Minimalist Top Actions */}
                <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
                    <button
                        onClick={(e) => { e.preventDefault(); onToggleFav(dest); }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl ${
                            isFav 
                            ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/20' 
                            : 'bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black hover:scale-105'
                        }`}
                    >
                        <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="absolute top-6 left-6 z-20 pointer-events-none">
                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm font-bold flex items-center gap-1.5 border border-white/20">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        {dest.rating || 'New'}
                    </div>
                </div>

                {/* Cinematic Content Reveal */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 discover-card-info pointer-events-none">
                    <div className="flex items-center text-white/80 text-sm font-bold mb-3 tracking-widest uppercase">
                        <MapPin className="w-4 h-4 mr-1.5 text-blue-400" />
                        <span>{dest.location || dest.country}</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tight drop-shadow-lg leading-tight">
                        {dest.name}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {dest.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center text-white/90 font-semibold group-hover:text-blue-400 transition-colors">
                        <span>Explore destination</span>
                        <Navigation className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                </div>
            </Link>
        </div>
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
    const carouselRef = useRef(null);

    useEffect(() => {
        setDestinations(getCuratedDestinations());
    }, []);

    // Set up JS fallback for scroll-state highlighting
    useEffect(() => {
        if (!carouselRef.current) return;
        
        // Detect if native scroll-state is supported (very naive check, using CSS.supports is safer)
        const supportsScrollState = CSS.supports('container-type', 'scroll-state');
        
        if (!supportsScrollState) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    entry.target.classList.toggle('is-snapped', entry.isIntersecting);
                });
            }, {
                root: carouselRef.current,
                // Intersects when element is within the center 10% of the carousel
                rootMargin: "0px -45%"
            });

            const items = carouselRef.current.querySelectorAll('.discover-carousel-item');
            items.forEach(item => observer.observe(item));

            return () => {
                items.forEach(item => observer.unobserve(item));
            };
        }
    }, [destinations, filter]); // Re-run when destinations change

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
            
            // Scroll to start of carousel on search
            if (carouselRef.current) {
                carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
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
        <div className="min-h-screen bg-[#030712] transition-colors duration-500 overflow-hidden font-sans relative selection:bg-blue-500/30">
            <style dangerouslySetInnerHTML={{ __html: discoverStyles }} />
            
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen animate-pulse duration-10000" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none opacity-50 mix-blend-screen" />

            {/* Cinematic Hero Overlay */}
            <div className="absolute top-0 left-0 right-0 pt-32 md:pt-40 z-30 pointer-events-none flex flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center px-4"
                >
                    <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-black text-white tracking-tighter mb-4 leading-none">
                        The world is <br className="hidden md:block"/>yours to explore.
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 font-medium max-w-2xl mx-auto mb-10 tracking-wide">
                        Curated experiences tailored to your personal aesthetic.
                    </p>
                </motion.div>

                {/* Glassmorphic Search & Filters (Pointer events enabled here) */}
                <div className="pointer-events-auto w-full max-w-3xl px-6 flex flex-col items-center gap-8">
                    <motion.form 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        onSubmit={handleSearch} 
                        className="w-full relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                        <LocationInput
                            value={query}
                            onChange={(val) => setQuery(val)}
                            placeholder="Where to next?"
                            icon={Search}
                            variant="glass"
                            className="bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/50 h-16 text-lg rounded-full shadow-2xl"
                        />
                        <button type="submit" className="hidden" />
                    </motion.form>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full justify-start md:justify-center px-4 pb-4"
                    >
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 backdrop-blur-md border ${
                                    filter === cat 
                                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' 
                                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Full-Bleed Horizontal Gallery */}
            <div className="absolute inset-0 top-0 pt-[45vh] md:pt-[50vh] pb-20">
                <div 
                    ref={carouselRef}
                    className="discover-carousel w-full h-full items-end pb-12"
                >
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="discover-carousel-item px-4 w-[320px] md:w-[500px] h-[500px] md:h-[700px] flex items-center justify-center"
                            >
                                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            </motion.div>
                        ) : filteredDestinations.length > 0 ? (
                            filteredDestinations.map((dest, index) => (
                                <DestinationCard key={dest.id || index} dest={dest} index={index} isFav={isFavourite(dest.id)} onToggleFav={toggleFavourite} />
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="discover-carousel-item px-4 w-full max-w-lg flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center mb-6">
                                    <Search className="w-10 h-10 text-white/40" />
                                </div>
                                <h3 className="text-3xl font-display font-bold text-white mb-3">No gems found</h3>
                                <p className="text-white/50 text-lg">Adjust your search or explore our curated collections.</p>
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
