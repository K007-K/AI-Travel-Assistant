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
        id: 'kyoto',
        title: 'Kyoto',
        subtitle: 'Ancient Temples',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2000&auto=format&fit=crop',
        tags: ['4 Days', 'Cultural', 'Zen'],
        days: [
            { day: 1, title: 'Kinkaku-ji & Bamboo Grove' },
            { day: 2, title: 'Traditional Tea Ceremony' },
            { day: 3, title: 'Gion District Walk' }
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
        <section className="relative w-full py-20 bg-[#fafafa] overflow-hidden flex flex-col items-center">
            {/* Section Header */}
            <div className="w-full max-w-6xl px-8 mb-12 z-10 text-center flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center"
                >
                    <span className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-4 flex items-center gap-2">
                        <Compass className="w-4 h-4" /> Destination Showcase
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Curated by AI.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Experienced by You.
                        </span>
                    </h2>
                </motion.div>
            </div>

            {/* Expansion Showcase Container */}
            <div className="w-full max-w-6xl px-4 md:px-8 h-[450px] md:h-[500px] flex gap-4">
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
                            }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className={`relative overflow-hidden cursor-pointer group shadow-sm border border-slate-200 transition-shadow duration-500 ${isActive ? 'shadow-2xl shadow-blue-900/10' : 'hover:shadow-md'}`}
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

                            {/* White Frosted Overlay for Collapsed State */}
                            <div className={`absolute inset-0 bg-white/50 backdrop-blur-[2px] transition-opacity duration-700 ${isActive ? 'opacity-0' : 'opacity-100 group-hover:opacity-80 group-hover:bg-white/40'}`} />

                            {/* Deep White Gradient Overlay for Expanded State (Text Readability) */}
                            <div className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'bg-gradient-to-t from-white via-white/60 to-transparent opacity-100' : 'opacity-0'}`} />

                            {/* Content Wrapper */}
                            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                                
                                {/* Collapsed State: Vertical Title */}
                                <AnimatePresence>
                                    {!isActive && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center pb-8"
                                        >
                                            <h3 className="text-slate-900 font-black text-2xl tracking-[0.2em] uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
                                            className="w-full flex justify-between items-end gap-6"
                                        >
                                            {/* Typography Area */}
                                            <div className="flex-1">
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="flex flex-wrap gap-2 mb-3"
                                                >
                                                    {dest.tags.map(tag => (
                                                        <span key={tag} className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 text-xs font-bold tracking-wide shadow-sm">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </motion.div>
                                                <motion.h3 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                    className="text-4xl lg:text-6xl font-black text-slate-900 mb-1 tracking-tight"
                                                >
                                                    {dest.title}
                                                </motion.h3>
                                                <motion.p 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="text-slate-600 text-base font-semibold"
                                                >
                                                    {dest.subtitle}
                                                </motion.p>
                                            </div>

                                            {/* Living Glassmorphic Itinerary Panel */}
                                            <motion.div 
                                                initial={{ opacity: 0, x: 40 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5, type: 'spring', damping: 20 }}
                                                className="hidden md:flex w-[280px] shrink-0 bg-white/90 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-3xl p-5 flex-col gap-4"
                                            >
                                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                                                        <Star className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-slate-900 font-bold text-sm">AI Curated Plan</h4>
                                                        <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Generated in 1.2s</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    {dest.days.map((day, i) => (
                                                        <motion.div 
                                                            key={day.day}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.7 + (i * 0.15) }}
                                                            className="flex items-start gap-3"
                                                        >
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-slate-600 text-[9px] font-black">{day.day}</span>
                                                            </div>
                                                            <p className="text-slate-700 text-xs font-bold leading-tight pt-1">{day.title}</p>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {/* View Button */}
                                                <button className="mt-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors duration-300 shadow-md group">
                                                    View Full Itinerary
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
