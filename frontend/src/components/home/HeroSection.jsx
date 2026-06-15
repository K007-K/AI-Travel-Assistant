import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users } from 'lucide-react';

const SearchPill = () => {
    return (
        <div className="w-full bg-white rounded-full p-3 shadow-2xl shadow-black/10 border border-slate-100 flex flex-col md:flex-row items-center gap-2">
            
            {/* Where */}
            <div className="flex-1 flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-slate-50 rounded-[2rem] transition-colors w-full md:w-auto">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase mb-0.5">Where to?</span>
                    <input 
                        type="text" 
                        placeholder="Search destinations"
                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                    />
                </div>
            </div>

            <div className="hidden md:block w-px h-12 bg-slate-200" />

            {/* When */}
            <div className="flex-1 flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-slate-50 rounded-[2rem] transition-colors w-full md:w-auto">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase mb-0.5">When?</span>
                    <input 
                        type="text" 
                        placeholder="Add dates"
                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                    />
                </div>
            </div>

            <div className="hidden md:block w-px h-12 bg-slate-200" />

            {/* Who */}
            <div className="flex-1 flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-slate-50 rounded-[2rem] transition-colors w-full md:w-auto">
                <Users className="w-5 h-5 text-slate-400" />
                <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase mb-0.5">Who?</span>
                    <input 
                        type="text" 
                        placeholder="Add guests"
                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                    />
                </div>
            </div>
            
            {/* Search Button */}
            <button className="w-full md:w-auto h-14 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-600/20">
                <Search className="w-5 h-5" />
                <span className="md:hidden">Search</span>
            </button>
        </div>
    );
};

const HeroSection = () => {
    return (
        <section className="relative w-full h-[85vh] min-h-[600px] flex flex-col items-center justify-between pb-0 bg-white">
            
            {/* Jaw-Dropping Travel Photograph Background */}
            <div className="absolute inset-0 z-0">
                {/* 
                  Using an extremely high-quality aerial shot of a tropical destination,
                  perfectly matching the aesthetic of tr4.webp and tr2.webp.
                */}
                <img 
                    src="https://images.unsplash.com/photo-1544085311-11a028465b03?q=80&w=3000&auto=format&fit=crop" 
                    alt="Stunning Aerial Tropical View" 
                    className="w-full h-full object-cover object-center"
                />
                
                {/* Subtle dark gradient overlay to ensure the white text pops flawlessly */}
                <div className="absolute inset-0 bg-black/30" />
                
                {/* Bottom gradient to blend slightly into the white section below if needed, though overlapping works better */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Massive Bold Typography Overlay */}
            <div className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center pt-24">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-[6rem] lg:text-[7rem] font-display font-black tracking-tight text-white leading-[1.1] drop-shadow-xl mb-6">
                        Explore The World
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-white/95 font-medium tracking-wide drop-shadow-lg max-w-2xl mx-auto">
                        What we offer is an unforgettable journey and experience.
                    </p>
                </motion.div>
            </div>

            {/* Clean Overlapping Search Bar */}
            {/* The translate-y-1/2 class pulls the search bar down so it exactly overlaps the hero image and the white section below it, matching the references perfectly. */}
            <motion.div 
                className="relative z-20 w-full max-w-5xl mx-auto px-4 translate-y-1/2"
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
