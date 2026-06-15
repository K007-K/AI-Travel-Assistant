import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users } from 'lucide-react';

const SearchPill = () => {
    return (
        <div className="w-full bg-white rounded-full p-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col md:flex-row items-center gap-1.5 relative z-20">
            
            {/* Where */}
            <div className="flex-1 flex items-center gap-3 px-6 py-2.5 cursor-pointer hover:bg-slate-50/80 rounded-full transition-colors w-full md:w-auto">
                <MapPin className="w-[18px] h-[18px] text-slate-400" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase mb-0.5">Where to?</span>
                    <input 
                        type="text" 
                        placeholder="Search destinations"
                        className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                    />
                </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200/60" />

            {/* When */}
            <div className="flex-1 flex items-center gap-3 px-6 py-2.5 cursor-pointer hover:bg-slate-50/80 rounded-full transition-colors w-full md:w-auto">
                <Calendar className="w-[18px] h-[18px] text-slate-400" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase mb-0.5">When?</span>
                    <input 
                        type="text" 
                        placeholder="Add dates"
                        className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                    />
                </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200/60" />

            {/* Who */}
            <div className="flex-1 flex items-center gap-3 px-6 py-2.5 cursor-pointer hover:bg-slate-50/80 rounded-full transition-colors w-full md:w-auto">
                <Users className="w-[18px] h-[18px] text-slate-400" />
                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase mb-0.5">Who?</span>
                    <input 
                        type="text" 
                        placeholder="Add guests"
                        className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                    />
                </div>
            </div>
            
            {/* Search Button */}
            <button className="w-full md:w-auto h-12 px-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-slate-900/20">
                <Search className="w-4 h-4" />
                <span className="text-sm md:hidden">Search</span>
            </button>
        </div>
    );
};

const HeroSection = () => {
    return (
        <section className="relative w-full h-[85vh] min-h-[600px] flex flex-col items-center justify-between pb-0 bg-white overflow-visible">
            
            {/* Bright & Vibrant Tropical Photograph Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=3000&auto=format&fit=crop" 
                    alt="Crystal Clear Tropical Beach" 
                    className="w-full h-full object-cover object-center"
                />
                
                {/* Very subtle dark gradient overlay just at the top and middle to ensure text pops, but keeping the bright beach vibe */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent" />
            </div>

            {/* Perfected Typography matching references (Script + Elegant Serif) */}
            <div className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center pt-28">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    {/* The cursive script element (like "Explore Beautiful" in tr.webp) */}
                    <span 
                        className="block text-4xl md:text-5xl lg:text-6xl text-white mb-2 drop-shadow-md" 
                        style={{ fontFamily: "'Great Vibes', cursive" }}
                    >
                        Explore the beautiful
                    </span>
                    
                    {/* The massive Serif headline (like tr4.webp) */}
                    <h1 
                        className="text-[4rem] md:text-[6.5rem] lg:text-[8rem] text-white leading-[0.95] drop-shadow-xl"
                        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
                    >
                        WORLD
                    </h1>
                </motion.div>
            </div>

            {/* Clean Overlapping Search Bar - perfectly proportioned and overlapping the white section below */}
            <motion.div 
                className="relative z-20 w-full max-w-4xl mx-auto px-4 translate-y-1/2"
                initial={{ y: "80%", opacity: 0 }}
                animate={{ y: "50%", opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
                <SearchPill />
            </motion.div>

        </section>
    );
};

export default HeroSection;
