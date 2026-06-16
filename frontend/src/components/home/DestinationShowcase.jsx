import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Compass, ArrowRight, Star } from 'lucide-react';

const destinations = [
    {
        id: 'tokyo',
        title: 'Tokyo',
        subtitle: 'Neon & Tradition',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2000&auto=format&fit=crop',
        tags: ['5 Days', 'Omakase', 'Luxury'],
        days: [
            { day: 1, title: 'Arrival & Shinjuku Neon' },
            { day: 2, title: 'Asakusa Tradition & Ryokan' },
            { day: 3, title: 'Exclusive Omakase Dining' }
        ]
    },
    {
        id: 'amalfi',
        title: 'Amalfi Coast',
        subtitle: 'Mediterranean Dream',
        image: 'https://images.unsplash.com/photo-1533676802871-eca1ae998cd5?q=80&w=2000&auto=format&fit=crop',
        tags: ['7 Days', 'Coastal', 'Relaxation'],
        days: [
            { day: 1, title: 'Villa Check-in & Sunset View' },
            { day: 2, title: 'Private Boat to Capri' },
            { day: 3, title: 'Positano Cliffside Dining' }
        ]
    },
    {
        id: 'swiss',
        title: 'Swiss Alps',
        subtitle: 'Alpine Majesty',
        image: 'https://images.unsplash.com/photo-1531366936337-77b5a8eb82f1?q=80&w=2000&auto=format&fit=crop',
        tags: ['4 Days', 'Adventure', 'Nature'],
        days: [
            { day: 1, title: 'Scenic Glacier Express' },
            { day: 2, title: 'Zermatt Skiing & Matterhorn' },
            { day: 3, title: 'Alpine Spa & Fondue' }
        ]
    },
    {
        id: 'santorini',
        title: 'Santorini',
        subtitle: 'Aegean Romance',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop',
        tags: ['6 Days', 'Romance', 'Sunsets'],
        days: [
            { day: 1, title: 'Oia Sunset & Cliff Suites' },
            { day: 2, title: 'Caldera Catamaran Cruise' },
            { day: 3, title: 'Volcanic Wine Tasting' }
        ]
    }
];

const DestinationShowcase = () => {
    const [activeId, setActiveId] = useState('tokyo');

    return (
        <section className="relative w-full py-32 bg-[#0a0a0a] overflow-hidden flex flex-col items-center">
            {/* Section Header */}
            <div className="w-full max-w-7xl px-8 mb-16 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-start"
                >
                    <span className="text-blue-400 font-bold tracking-widest text-sm uppercase mb-4 flex items-center gap-2">
                        <Compass className="w-4 h-4" /> Destination Showcase
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                        Curated by AI.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500">
                            Experienced by You.
                        </span>
                    </h2>
                </motion.div>
            </div>

            {/* Expansion Showcase Container */}
            <div className="w-full max-w-[1400px] px-4 md:px-8 h-[600px] lg:h-[700px] flex gap-4">
                {destinations.map((dest) => {
                    const isActive = activeId === dest.id;

                    return (
                        <motion.div
                            key={dest.id}
                            layout
                            onClick={() => setActiveId(dest.id)}
                            initial={{ borderRadius: '2rem' }}
                            animate={{
                                flex: isActive ? 4 : 1,
                                opacity: isActive ? 1 : 0.6,
                                filter: isActive ? 'grayscale(0%)' : 'grayscale(60%)'
                            }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Spring-like ease out
                            className={`relative overflow-hidden cursor-pointer group ${isActive ? 'shadow-2xl shadow-blue-900/20' : 'hover:opacity-100 hover:filter-none'}`}
                            style={{ borderRadius: '2rem' }}
                        >
                            {/* Background Image with Parallax Scale */}
                            <motion.img
                                src={dest.image}
                                alt={dest.title}
                                className="absolute inset-0 w-full h-full object-cover transform-gpu"
                                animate={{
                                    scale: isActive ? 1.05 : 1
                                }}
                                transition={{ duration: 4, ease: "easeOut" }}
                            />

                            {/* Deep Cinematic Overlay */}
                            <div className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent' : 'bg-black/40 group-hover:bg-black/20'}`} />

                            {/* Content Wrapper */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                
                                {/* Collapsed State: Vertical Title */}
                                <AnimatePresence>
                                    {!isActive && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center pb-8"
                                        >
                                            <h3 className="text-white font-black text-3xl tracking-[0.2em] uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                {dest.title}
                                            </h3>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Expanded State: Full Content */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="w-full flex justify-between items-end gap-8"
                                        >
                                            {/* Typography Area */}
                                            <div className="flex-1">
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="flex gap-3 mb-4"
                                                >
                                                    {dest.tags.map(tag => (
                                                        <span key={tag} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wide">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </motion.div>
                                                <motion.h3 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                    className="text-5xl lg:text-7xl font-black text-white mb-2 tracking-tighter"
                                                >
                                                    {dest.title}
                                                </motion.h3>
                                                <motion.p 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="text-slate-300 text-lg lg:text-xl font-medium"
                                                >
                                                    {dest.subtitle}
                                                </motion.p>
                                            </div>

                                            {/* Living Glassmorphic Itinerary Panel */}
                                            <motion.div 
                                                initial={{ opacity: 0, x: 40 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5, type: 'spring', damping: 20 }}
                                                className="hidden md:flex w-[320px] shrink-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex-col gap-5"
                                            >
                                                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                        <Star className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">AI Curated Plan</h4>
                                                        <p className="text-slate-400 text-xs">Generated in 1.2s</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    {dest.days.map((day, i) => (
                                                        <motion.div 
                                                            key={day.day}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.7 + (i * 0.15) }}
                                                            className="flex items-start gap-3"
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-white text-[10px] font-bold">{day.day}</span>
                                                            </div>
                                                            <p className="text-slate-200 text-sm font-medium leading-tight pt-1">{day.title}</p>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {/* Magnetic View Button Simulation */}
                                                <button className="mt-2 w-full py-3.5 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors group">
                                                    View Full Itinerary
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </button>

                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export default DestinationShowcase;
