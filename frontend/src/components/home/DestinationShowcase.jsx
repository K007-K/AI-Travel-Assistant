import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

    // Auto-play logic (Cycles every 5s unless hovered)
    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(() => {
            setActiveId(current => {
                const currentIndex = destinations.findIndex(d => d.id === current);
                const nextIndex = (currentIndex + 1) % destinations.length;
                return destinations[nextIndex].id;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [isHovered]);

    // 3D Parallax Tilt Logic for the Active Card
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["4deg", "-4deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-4deg", "4deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    };

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

                {/* Expansion Showcase Container */}
                <motion.div 
                    className="w-full max-w-6xl mx-auto h-[500px] flex gap-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.15 } }
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{ perspective: 1200 }}
                >
                    {destinations.map((dest) => {
                        const isActive = activeId === dest.id;

                        return (
                            <motion.div
                                key={dest.id}
                                layout
                                onClick={() => setActiveId(dest.id)}
                                variants={{
                                    hidden: { opacity: 0, y: 50, scale: 0.95 },
                                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } }
                                }}
                                animate={{
                                    flex: isActive ? 5 : 1,
                                }}
                                style={isActive ? { rotateX, rotateY, transformStyle: "preserve-3d" } : {}}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
                                className={`relative rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl ${isActive ? 'shadow-2xl shadow-slate-900/30 ring-1 ring-white/20' : 'hover:bg-slate-100'}`}
                            >
                                {/* Background Image */}
                                <motion.img 
                                    src={dest.image}
                                    alt={dest.title}
                                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] ease-out ${isActive ? 'scale-105' : 'scale-100 grayscale-[0.5] group-hover:grayscale-0'}`}
                                />
                                
                                {/* Active State Progress Bar */}
                                {isActive && (
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/20 z-50 overflow-hidden">
                                        <motion.div 
                                            key={activeId} // Resets animation when ID changes
                                            initial={{ width: "0%" }}
                                            animate={{ width: isHovered ? "0%" : "100%" }}
                                            transition={{ duration: isHovered ? 0 : 5, ease: "linear" }}
                                            className="h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                        />
                                    </div>
                                )}

                                {/* Collapsed State UI */}
                                <AnimatePresence>
                                    {!isActive && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex flex-col items-center justify-end pb-8"
                                        >
                                            <div 
                                                className="text-white font-display font-bold text-2xl tracking-widest uppercase opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap drop-shadow-lg"
                                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                            >
                                                {dest.title}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Expanded State UI */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4, delay: 0.1 }}
                                            className="absolute inset-0"
                                            style={{ transform: "translateZ(30px)" }} // Pushes content out in 3D
                                        >
                                            {/* Gradient Overlay for Text Legibility */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/30 to-transparent pointer-events-none" />

                                            <div className="absolute inset-0 p-8 flex flex-col justify-end pointer-events-none">
                                                <div className="flex items-end justify-between w-full gap-8">
                                                    
                                                    {/* Left: Title & Tags */}
                                                    <div className="flex-1 pointer-events-auto">
                                                        <div className="flex gap-2 mb-4">
                                                            {dest.tags.map(tag => (
                                                                <span key={tag} className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-sm">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <h3 className="text-5xl md:text-[5rem] font-display font-black text-white tracking-tight mb-2 leading-none" style={{textShadow: "0 10px 30px rgba(0,0,0,0.6)"}}>
                                                            {dest.title}
                                                        </h3>
                                                        <p className="text-lg md:text-xl font-medium text-white/90 drop-shadow-md">
                                                            {dest.subtitle}
                                                        </p>
                                                    </div>

                                                    {/* Right: Liquid Glass Itinerary Panel */}
                                                    <div className="hidden md:block w-[340px] bg-black/10 backdrop-blur-[40px] border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] pointer-events-auto shrink-0 transform transition-transform hover:-translate-y-2 relative overflow-hidden group/panel">
                                                        {/* Subtle inner glow */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-30 pointer-events-none" />
                                                        
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-4 mb-5 border-b border-white/10 pb-5">
                                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                                                                    <Star className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[13px] font-black uppercase tracking-widest text-white">AI Curated Plan</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4 mb-6">
                                                                {dest.plan.map((item, index) => (
                                                                    <div key={index} className="flex items-center gap-3">
                                                                        <div className="w-6 h-6 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm">
                                                                            {index + 1}
                                                                        </div>
                                                                        <p className="text-[14px] text-white/90 font-medium leading-tight">{item}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.1)]">
                                                                View Full Itinerary <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default DestinationShowcase;
