import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowLeft, MapPin, Star, Globe, DollarSign, Clock, Calendar,
    Utensils, Landmark, Lightbulb, Sun, Heart, ChevronRight, Compass, Users,
    Camera, Mountain, Shield, Plane
} from 'lucide-react';
import { getDestinationById } from '../api/places';
import { fetchWikiSummary } from '../api/wikipediaService';
import { enrichDestinationWithAI } from '../api/destinationEnrichment';
import { loadDestinationImage, getFallbackImage } from '../utils/destinationImages';


/* ─── Reusable section wrapper ──────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
const Section = ({ icon: Icon, title, children, delay = 0 }) => (
    <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay }}
        className="mb-10"
    >
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
                <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{title}</h2>
        </div>
        {children}
    </motion.section>
);

/* ─── Highlight Card with Wikipedia image ───────────────────────── */
const HighlightCard = ({ highlight, index, destinationName: _destinationName }) => {
    const [imgUrl, setImgUrl] = useState(null);
    useEffect(() => {
        loadDestinationImage(highlight.name, setImgUrl);
    }, [highlight.name]);

    const fallback = getFallbackImage(highlight.name);
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.45 }}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700"
        >
            <div className="h-44 overflow-hidden relative">
                <img
                    src={imgUrl || fallback}
                    alt={highlight.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/90 dark:bg-[#0a0a0a]/90 text-primary-600 dark:text-primary-400 backdrop-blur-sm shadow-sm">
                    #{index + 1}
                </span>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-base text-slate-800 dark:text-white mb-1.5">{highlight.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{highlight.desc}</p>
            </div>
        </motion.div>
    );
};

/* ─── Cuisine Card with photo ──────────────────────────────────────────── */
const CuisineCard = ({ item, index, destinationName: _destinationName }) => {
    const [imgUrl, setImgUrl] = useState(null);
    useEffect(() => {
        loadDestinationImage(item.name, setImgUrl);
    }, [item.name]);

    const fallback = getFallbackImage(item.name);
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className="group flex gap-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/50 hover:shadow-md transition-shadow duration-300 overflow-hidden"
        >
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden shadow-sm">
                <img
                    src={imgUrl || fallback}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 dark:text-white mb-0.5 text-sm">{item.name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
        </motion.div>
    );
};

/* ─── Tip Card ──────────────────────────────────────────────────── */
const TipCard = ({ tip, index }) => {
    const icons = [Lightbulb, Shield, Compass, Camera, Globe, Users, Mountain, Plane];
    const colors = [
        'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
        'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
        'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
        'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400'
    ];
    const TipIcon = icons[index % icons.length];
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className={`w-9 h-9 rounded-lg ${colors[index % colors.length]} flex items-center justify-center mb-2.5`}>
                <TipIcon className="w-4 h-4" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{tip}</p>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function DestinationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Try curated first, then sessionStorage for search results
    const [dest, setDest] = useState(() => {
        const curated = getDestinationById(id);
        if (curated) return curated;
        // Check sessionStorage for search-result destination
        try {
            const cached = sessionStorage.getItem(`dest_${id}`);
            return cached ? JSON.parse(cached) : null;
        } catch { return null; /* sessionStorage unavailable */ }
    });
    const [isEnriching, setIsEnriching] = useState(false);

    const [heroImg, setHeroImg] = useState(null);
    const [liked, setLiked] = useState(false);

    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.3]);

    // Enrich dynamic destinations with AI-generated details + Wikipedia image
    useEffect(() => {
        if (!dest || !dest._source || dest._enriched) return;

        let cancelled = false;
        setIsEnriching(true);

        (async () => {
            // 1. Wikipedia — for hero image
            const wiki = await fetchWikiSummary(dest.name);

            // 2. Groq AI — for highlights, cuisine, culture, tips (same shape as curated)
            const aiData = await enrichDestinationWithAI(dest.name, dest.country);

            if (cancelled) return;

            setDest(prev => ({
                ...prev,
                // Wikipedia image
                image: wiki?.originalImage || wiki?.thumbnail || prev.image,
                // AI-generated rich content
                ...(aiData || {}),
                // Keep original description if AI provided a better one; prefer AI
                description: aiData?.description || wiki?.extract || prev.description,
                _enriched: true,
            }));
            setIsEnriching(false);
        })();

        return () => { cancelled = true; };
    }, [dest]);

    // Use high-quality image
    useEffect(() => {
        if (dest) setHeroImg(dest.image);
    }, [dest]);

    if (!dest) {
        return (
            <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#0a0a0a]">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Destination not found</h1>
                <Link to="/discover" className="btn btn-primary">Browse Destinations</Link>
            </div>
        );
    }

    const statItems = [
        dest.language && { icon: Globe, label: 'Language', value: dest.language },
        dest.timezone && { icon: Clock, label: 'Timezone', value: dest.timezone },
        dest.bestTimeToVisit?.season && { icon: Calendar, label: 'Best Time', value: dest.bestTimeToVisit.season },
        dest.bestFor && { icon: Users, label: 'Best For', value: dest.bestFor },
        dest.country && !dest.language && { icon: Globe, label: 'Country', value: dest.country },
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
            {/* ── HERO ────────────────────────────────────────────── */}
            <div ref={heroRef} className="relative h-[70vh] min-h-[480px] overflow-hidden">
                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
                    <img
                        src={heroImg || dest.image || getFallbackImage(dest.name)}
                        alt={dest.name}
                        className="w-full h-full object-cover"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 pt-24 px-8 flex justify-between items-start z-10">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/90 hover:text-white bg-white/15 backdrop-blur-md rounded-xl px-4 py-2.5 transition-all hover:bg-white/25 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={() => setLiked(!liked)} className={`p-3 rounded-full backdrop-blur-md transition-all ${liked ? 'bg-red-500 text-white' : 'bg-white/15 text-white/90 hover:bg-white/25'}`}>
                        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Hero text */}
                <div className="absolute bottom-0 left-0 right-0 px-8 md:px-12 pb-20 z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-sm font-medium flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> {dest.location}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-yellow-500/25 backdrop-blur-md text-yellow-200 text-sm font-semibold flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {dest.rating}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">{dest.name}</h1>
                        <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">{dest.description}</p>
                    </motion.div>
                </div>
            </div>

            {/* ── QUICK STATS BAR ─────────────────────────────────── */}
            {statItems.length > 0 && (
            <div className="relative -mt-8 z-20 max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className={`bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 px-8 py-5 grid grid-cols-2 md:grid-cols-${Math.min(statItems.length, 4)} gap-6`}
                >
                    {statItems.map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center text-primary-500 dark:text-primary-400 flex-shrink-0 shadow-sm">
                                <s.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{s.label}</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
            )}

            {/* ── MAIN CONTENT ────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Tags */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-2 mb-8">
                    {dest.tags?.map(tag => (
                        <span key={tag} className="px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-semibold border border-primary-200 dark:border-primary-800/50">
                            {tag}
                        </span>
                    ))}
                </motion.div>

                {/* ESTIMATED BUDGET */}
                {dest.minBudgetPerDay && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                    className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-800/50 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500 shadow-md flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                        You can visit <span className="font-bold text-slate-900 dark:text-white">{dest.name}</span> with an estimated minimum budget of{' '}
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{dest.minBudgetPerDay}</span> per day.
                    </p>
                </motion.div>
                )}

                {/* Enriching indicator */}
                {isEnriching && (
                    <div className="mb-6 p-5 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 text-center">
                        <div className="animate-pulse text-primary-600 dark:text-primary-400 font-medium">
                            ✨ Generating destination details with AI...
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Highlights, cuisine, tips, and more</p>
                    </div>
                )}

                {/* TOP HIGHLIGHTS — curated only */}
                {dest.highlights?.length > 0 && (
                <Section icon={Landmark} title="Top Highlights" delay={0.1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {dest.highlights.map((h, i) => (
                            <HighlightCard key={h.name} highlight={h} index={i} destinationName={dest.name} />
                        ))}
                    </div>
                </Section>
                )}

                {/* LOCAL CUISINE — curated only */}
                {dest.cuisine?.length > 0 && (
                <Section icon={Utensils} title="Local Cuisine" delay={0.1}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dest.cuisine.map((c, i) => (
                            <CuisineCard key={c.name} item={c} index={i} destinationName={dest.name} />
                        ))}
                    </div>
                </Section>
                )}

                {/* CULTURE & FESTIVALS — curated only */}
                {dest.culture && (
                <Section icon={Globe} title="Culture & Festivals" delay={0.1}>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200 dark:border-indigo-800/50">
                        <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">{dest.culture}</p>
                    </div>
                </Section>
                )}

                {/* BEST TIME TO VISIT — curated only */}
                {dest.bestTimeToVisit && (
                <Section icon={Sun} title="Best Time to Visit" delay={0.1}>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-shrink-0 w-full md:w-56 p-5 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg">
                            <Calendar className="w-7 h-7 mb-2 opacity-80" />
                            <p className="text-xl font-bold mb-0.5">{dest.bestTimeToVisit?.season}</p>
                            <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Recommended</p>
                        </div>
                        <div className="flex-1 p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 flex items-center shadow-sm">
                            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">{dest.bestTimeToVisit?.note}</p>
                        </div>
                    </div>
                </Section>
                )}

                {/* TRAVEL TIPS — curated only */}
                {dest.travelTips?.length > 0 && (
                <Section icon={Lightbulb} title="Travel Tips" delay={0.1}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dest.travelTips.map((tip, i) => (
                            <TipCard key={i} tip={tip} index={i} />
                        ))}
                    </div>
                </Section>
                )}

                {/* ── PLAN A TRIP CTA ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 text-center"
                >
                    <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white" />
                            <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-white" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white mb-2">
                                Ready to explore {dest.name}?
                            </h2>
                            <p className="text-primary-100 text-base mb-6 max-w-lg mx-auto">
                                Let our AI craft your perfect itinerary — with accommodation, activities, and budget tailored to your style.
                            </p>
                            <button
                                onClick={() => navigate(`/itinerary?destination=${encodeURIComponent(dest.name)}`)}
                                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-primary-700 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                            >
                                <Plane className="w-5 h-5" />
                                Plan a Trip to {dest.name}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>


        </div>
    );
}
