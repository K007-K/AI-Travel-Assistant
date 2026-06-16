import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Star, ArrowRight } from 'lucide-react';

const destinations = [
    {
        id: 1,
        title: "Tokyo",
        subtitle: "Neon & Tradition",
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2000&auto=format&fit=crop",
        tags: ["5 Days", "Omakase", "Luxury"],
        plan: [
            "Arrival & Shinjuku Neon",
            "Asakusa Tradition & Ryokan",
            "Exclusive Omakase Dining"
        ]
    },
    {
        id: 2,
        title: "Amalfi Coast",
        subtitle: "Mediterranean Dream",
        image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=2000&auto=format&fit=crop",
        tags: ["7 Days", "Boating", "Scenic"],
        plan: [
            "Positano Cliffside Views",
            "Private Boat to Capri",
            "Authentic Pasta Making"
        ]
    },
    {
        id: 3,
        title: "Kyoto",
        subtitle: "Ancient Serenity",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2000&auto=format&fit=crop",
        tags: ["4 Days", "Temples", "Culture"],
        plan: [
            "Bamboo Forest Walk",
            "Traditional Tea Ceremony",
            "Fushimi Inari Shrine"
        ]
    },
    {
        id: 4,
        title: "Santorini",
        subtitle: "Aegean Elegance",
        image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=2000&auto=format&fit=crop",
        tags: ["6 Days", "Sunsets", "Couples"],
        plan: [
            "Oia Sunset Catamaran",
            "Wine Tasting in Fira",
            "Volcanic Hot Springs"
        ]
    }
];

const DestinationShowcase = () => {
    const [activeId, setActiveId] = useState(1);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-play logic
    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(() => {
            setActiveId(current => {
                const currentIndex = destinations.findIndex(d => d.id === current);
                const nextIndex = (currentIndex + 1) % destinations.length;
                return destinations[nextIndex].id;
            });
        }, 6000);
        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <section className="w-full bg-[#fafafa] py-32 overflow-hidden relative">
            {/* Dynamic Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm"
                    >
                        <Compass className="w-3.5 h-3.5" />
                        Destination Showcase
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-display font-black text-slate-900 tracking-tight leading-[1.1]"
                    >
                        Curated by AI. <br />
                        <span className="text-blue-600">Experienced by You.</span>
                    </motion.h2>
                </div>

                {/* Spatial Bento Grid Container */}
                <div 
                    className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 w-full h-[800px] lg:h-[650px]"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* HERO TILE (Left/Top) */}
                    <div className="lg:col-span-3 h-[500px] lg:h-full w-full relative perspective-[2000px]">
                        {destinations.map(dest => {
                            if (dest.id !== activeId) return null;
                            return (
                                <motion.div
                                    key={`hero-${dest.id}`}
                                    layoutId={`card-${dest.id}`}
                                    className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 z-10"
                                    transition={{ type: "spring", damping: 30, stiffness: 150 }}
                                >
                                    {/* Cinematic Background */}
                                    <motion.img
                                        layoutId={`img-${dest.id}`}
                                        src={dest.image}
                                        alt={dest.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    
                                    {/* Gradient Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none opacity-90" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none opacity-50" />

                                    {/* Hero Content */}
                                    <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end pointer-events-none">
                                        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between w-full gap-8">
                                            
                                            {/* Left: Title & Tags */}
                                            <div className="flex-1 pointer-events-auto">
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="flex flex-wrap gap-2 mb-5"
                                                >
                                                    {dest.tags.map(tag => (
                                                        <span key={tag} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-sm">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </motion.div>
                                                
                                                <motion.h3 
                                                    initial={{ opacity: 0, x: -30 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                                                    className="text-6xl md:text-[6rem] xl:text-[7rem] font-display font-black text-white tracking-tight mb-2 leading-none" 
                                                    style={{ textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}
                                                >
                                                    {dest.title}
                                                </motion.h3>
                                                
                                                <motion.p 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="text-xl md:text-2xl font-medium text-white/90 drop-shadow-md"
                                                >
                                                    {dest.subtitle}
                                                </motion.p>
                                            </div>

                                            {/* Right: Premium Glass Itinerary Panel */}
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                                                className="w-full xl:w-[380px] rounded-3xl p-7 relative overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] shrink-0 pointer-events-auto mt-6 xl:mt-0"
                                            >
                                                {/* Inner 3D Highlight */}
                                                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60" />

                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/10">
                                                        <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.6)] border border-white/20">
                                                            <Star className="w-6 h-6 text-white" fill="currentColor" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black uppercase tracking-widest text-white drop-shadow-md mb-0.5">AI Curated Plan</p>
                                                            <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider">Perfected for you</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-5 mb-8">
                                                        {dest.plan.map((item, index) => (
                                                            <div key={index} className="flex items-center gap-4">
                                                                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-[inset_0_2px_5px_rgba(255,255,255,0.1)] backdrop-blur-md shrink-0">
                                                                    {index + 1}
                                                                </div>
                                                                <p className="text-sm font-medium text-white/95 drop-shadow-sm leading-snug">{item}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.15)] group/btn">
                                                        View Full Itinerary <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* PREVIEW STACK (Right/Bottom) */}
                    <div className="lg:col-span-1 h-[250px] lg:h-full w-full flex flex-row lg:flex-col gap-4 lg:gap-6 relative">
                        {destinations.map(dest => {
                            if (dest.id === activeId) return null;
                            return (
                                <motion.div
                                    key={`preview-${dest.id}`}
                                    layoutId={`card-${dest.id}`}
                                    onClick={() => setActiveId(dest.id)}
                                    className="flex-1 rounded-[2rem] overflow-hidden shadow-lg bg-slate-900 cursor-pointer group relative"
                                    transition={{ type: "spring", damping: 30, stiffness: 150 }}
                                >
                                    <motion.img
                                        layoutId={`img-${dest.id}`}
                                        src={dest.image}
                                        alt={dest.title}
                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                                    
                                    <div className="absolute inset-0 p-5 lg:p-6 flex flex-col justify-end pointer-events-none">
                                        <h3 className="text-xl lg:text-2xl font-display font-black text-white tracking-wide leading-tight group-hover:-translate-y-1 transition-transform duration-500">{dest.title}</h3>
                                        <p className="text-xs lg:text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors duration-500 hidden lg:block">{dest.subtitle}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DestinationShowcase;
