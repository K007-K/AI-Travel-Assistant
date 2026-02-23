import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Star, ChevronRight, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import useFavourites from '../hooks/useFavourites';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';

/* ─── Favourite Card with lazy image ─────────────────────── */
const FavouriteCard = ({ dest, onRemove }) => {
    const [imgUrl, setImgUrl] = useState(dest.image || null);

    useEffect(() => {
        if (!dest.image) {
            loadDestinationImage(dest.name, setImgUrl);
        }
    }, [dest.name, dest.image]);

    const fallback = getFallbackImage(dest.name);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="group bg-white dark:bg-white/[0.03] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-slate-800 flex flex-col h-full"
        >
            <div className="relative h-44 overflow-hidden flex-shrink-0">
                <img
                    src={imgUrl || fallback}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button
                    onClick={(e) => { e.preventDefault(); onRemove(dest.id); }}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-red-500/80 backdrop-blur-md text-white hover:bg-red-600 transition-all shadow-lg"
                    title="Remove from favourites"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-[11px] font-semibold flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" /> Favourite
                    </span>
                </div>
                {dest.rating && (
                    <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {dest.rating}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5 truncate">{dest.name}</h3>
                <div className="flex items-center text-slate-500 mb-2 text-xs">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{dest.location || dest.country || 'Unknown location'}</span>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 mb-3 min-h-[2rem] leading-relaxed">
                    {dest.description || 'A wonderful destination waiting to be explored.'}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
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

/* ─── Favourites Page ────────────────────────────────────── */
const Favourites = () => {
    const { favourites, removeFavourite } = useFavourites();
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = searchQuery.trim()
        ? favourites.filter(f =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.country || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : favourites;

    return (
        <div className="min-h-screen pt-20 pb-12 bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 pb-24 pt-10 px-4 mb-[-60px]">
                <div className="container-custom text-center text-white">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Heart className="w-8 h-8 fill-current" />
                        <h1 className="text-4xl font-display font-bold">My Favourites</h1>
                    </div>
                    <p className="text-white/80 text-lg max-w-2xl mx-auto mb-6">
                        {favourites.length === 0
                            ? 'Start exploring and save destinations you love!'
                            : `You have ${favourites.length} favourite destination${favourites.length !== 1 ? 's' : ''}`
                        }
                    </p>

                    {favourites.length > 0 && (
                        <div className="max-w-md mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your favourites..."
                                className="w-full pl-11 pr-4 py-3 rounded-full bg-white/90 backdrop-blur text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="container-custom">
                {favourites.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 flex items-center justify-center">
                            <Heart className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No favourites yet</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                            Explore destinations and tap the heart icon to save them here for quick access.
                        </p>
                        <Link
                            to="/discover"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                        >
                            <Search className="w-4 h-4" /> Discover Destinations
                        </Link>
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-500 text-lg">No favourites match "{searchQuery}"</p>
                    </div>
                ) : (
                    /* Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <AnimatePresence mode="popLayout">
                            {filtered.map((dest) => (
                                <FavouriteCard key={dest.id} dest={dest} onRemove={removeFavourite} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favourites;
