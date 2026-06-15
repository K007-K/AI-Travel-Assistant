import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Sparkles } from 'lucide-react';

const AuroraBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f4f7fb] z-0 pointer-events-none">
            {/* Liquid Mesh Glowing Orbs */}
            <div className="absolute inset-0 opacity-70">
                <motion.div 
                    animate={{ 
                        x: ['0%', '15%', '-15%', '0%'],
                        y: ['0%', '-15%', '15%', '0%'],
                        scale: [1, 1.1, 0.9, 1] 
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-blue-300/40 rounded-full mix-blend-multiply filter blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        x: ['0%', '-20%', '10%', '0%'],
                        y: ['0%', '20%', '-20%', '0%'],
                        scale: [1, 0.8, 1.2, 1] 
                    }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        x: ['0%', '20%', '-10%', '0%'],
                        y: ['0%', '20%', '-20%', '0%'],
                        scale: [1, 1.3, 0.8, 1] 
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] left-[10%] w-[80%] h-[80%] bg-rose-200/40 rounded-full mix-blend-multiply filter blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        x: ['0%', '-15%', '15%', '0%'],
                        y: ['0%', '-15%', '15%', '0%'],
                        scale: [1, 1.1, 0.9, 1] 
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-[120px]" 
                />
            </div>
            
            {/* Fine grain noise texture for premium editorial feel */}
            <div 
                className="absolute inset-0 opacity-[0.04] mix-blend-overlay" 
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} 
            />
        </div>
    );
};

const SearchPill = () => {
    const [focusedField, setFocusedField] = useState(null);

    const fields = [
        { id: 'where', icon: MapPin, label: 'Where to?', placeholder: 'Search destinations' },
        { id: 'when', icon: Calendar, label: 'When?', placeholder: 'Add dates' },
        { id: 'who', icon: Users, label: 'Who?', placeholder: 'Add guests' }
    ];

    return (
        <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto mt-16 bg-white/40 backdrop-blur-3xl rounded-[2rem] p-2 border border-white/60 flex flex-col md:flex-row items-center gap-2 relative z-20"
        >
            {fields.map((field, index) => {
                const Icon = field.icon;
                const isFocused = focusedField === field.id;
                
                return (
                    <React.Fragment key={field.id}>
                        <motion.div 
                            className={`flex-1 flex items-center gap-4 px-6 py-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isFocused ? 'bg-white/80 shadow-sm' : 'hover:bg-white/50'}`}
                            onClick={() => setFocusedField(field.id)}
                            layout
                        >
                            <Icon className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div className="flex flex-col text-left w-full">
                                <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase mb-0.5">{field.label}</span>
                                <input 
                                    type="text" 
                                    placeholder={field.placeholder}
                                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                                    onFocus={() => setFocusedField(field.id)}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </motion.div>
                        {index < fields.length - 1 && (
                            <div className="w-px h-10 bg-slate-200/50 hidden md:block" />
                        )}
                    </React.Fragment>
                );
            })}
            
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto h-16 px-10 rounded-[1.5rem] bg-slate-900 text-white font-bold flex items-center justify-center gap-3 transition-colors hover:bg-blue-600"
            >
                <Search className="w-5 h-5" />
                <span className="md:hidden">Search</span>
            </motion.button>
        </motion.div>
    );
};

const HeroSection = () => {
    return (
        <section className="relative w-full h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-[#f4f7fb]">
            
            {/* The Jaw-Dropping Liquid Aurora Mesh */}
            <AuroraBackground />

            {/* Content Overlay */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center pt-24">
                
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md text-slate-700 font-semibold text-xs tracking-wide uppercase mb-8 border border-white/60">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        The New Standard of Travel
                    </span>
                    
                    <h1 className="text-6xl md:text-[6.5rem] lg:text-[7.5rem] font-display font-black tracking-[-0.04em] text-slate-900 leading-[0.95]">
                        Explore the world.<br className="hidden md:block" />
                        <span className="text-slate-400">
                            With absolute clarity.
                        </span>
                    </h1>
                    
                    <p className="mt-8 text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
                        Experience breathtaking destinations curated by sentient AI. Flawless itineraries, spatial booking, and total financial clarity.
                    </p>
                </motion.div>

                <SearchPill />

            </div>
        </section>
    );
};

export default HeroSection;
