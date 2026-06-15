import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Sparkles } from 'lucide-react';

const SearchPill = () => {
    const [focusedField, setFocusedField] = useState(null);

    const fields = [
        { id: 'where', icon: MapPin, label: 'Location', placeholder: 'Where are you going?' },
        { id: 'when', icon: Calendar, label: 'Dates', placeholder: 'Add dates' },
        { id: 'who', icon: Users, label: 'Guests', placeholder: 'Add guests' }
    ];

    return (
        <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto mt-16 bg-white/95 backdrop-blur-3xl rounded-full p-2.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-white/60 flex flex-col md:flex-row items-center relative z-20"
        >
            {fields.map((field, index) => {
                const Icon = field.icon;
                const isFocused = focusedField === field.id;
                
                return (
                    <React.Fragment key={field.id}>
                        <div 
                            className={`flex-1 flex items-center gap-4 px-6 py-3.5 rounded-full cursor-pointer transition-all duration-300 relative ${isFocused ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100 scale-[1.02] z-10' : 'hover:bg-slate-50'}`}
                            onClick={() => setFocusedField(field.id)}
                        >
                            <div className={`p-2 rounded-full transition-colors duration-300 ${isFocused ? 'bg-blue-50' : 'bg-slate-100/50'}`}>
                                <Icon className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
                            </div>
                            <div className="flex flex-col text-left w-full">
                                <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase mb-0.5">{field.label}</span>
                                <input 
                                    type="text" 
                                    placeholder={field.placeholder}
                                    className="bg-transparent border-none outline-none text-base text-slate-900 placeholder:text-slate-300 w-full focus:ring-0 p-0 font-medium"
                                    onFocus={() => setFocusedField(field.id)}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </div>
                        {index < fields.length - 1 && (
                            <div className={`w-px h-12 bg-slate-200 mx-1 hidden md:block transition-opacity duration-300 ${focusedField === field.id || focusedField === fields[index + 1].id ? 'opacity-0' : 'opacity-100'}`} />
                        )}
                    </React.Fragment>
                );
            })}
            
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto h-[68px] px-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-3 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_15px_35px_-5px_rgba(59,130,246,0.6)] transition-all ml-2 border border-blue-400/30"
            >
                <Search className="w-5 h-5" />
                <span className="text-lg md:hidden">Search</span>
            </motion.button>
        </motion.div>
    );
};

const HeroSection = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });
    
    // Parallax Physics
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={ref} className="relative w-full h-[100vh] min-h-[850px] flex items-center justify-center overflow-hidden bg-black">
            
            <motion.div 
                style={{ y, opacity }}
                className="absolute inset-0 z-0 origin-bottom"
            >
                {/* Cinematic Slow Drone Zoom Effect */}
                <motion.img 
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.08 }}
                    transition={{ duration: 40, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
                    src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=3000&auto=format&fit=crop" 
                    alt="Vibrant Coastal Journey" 
                    className="w-full h-[120%] object-cover object-center"
                />
                
                {/* Perfected Gradient Overlays for Typography Contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-transparent z-10 mix-blend-multiply opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-transparent to-transparent z-10 opacity-30" />
            </motion.div>

            {/* Content Overlay */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center pt-24">
                
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white font-bold text-[11px] tracking-[0.2em] uppercase mb-8 border border-white/20 shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        AI-Powered Travel
                    </motion.span>
                    
                    {/* Ultra-Luxury Mixed Typography */}
                    <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-display font-black tracking-tighter text-white leading-[0.9] drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                        Explore <br className="hidden md:block" />
                        <span className="font-serif font-light italic tracking-normal text-white/95">the world</span>
                    </h1>
                    
                    <p className="mt-8 text-lg md:text-2xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                        Experience jaw-dropping destinations curated by sentient AI. Flawless itineraries, spatial booking, and total financial clarity.
                    </p>
                </motion.div>

                <SearchPill />

            </div>
        </section>
    );
};

export default HeroSection;
