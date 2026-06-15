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
            className="w-full max-w-4xl mx-auto mt-16 bg-white/95 backdrop-blur-md rounded-full p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col md:flex-row items-center relative z-20"
        >
            {fields.map((field, index) => {
                const Icon = field.icon;
                const isFocused = focusedField === field.id;
                
                return (
                    <React.Fragment key={field.id}>
                        <div 
                            className={`flex-1 flex items-center gap-4 px-6 py-3 rounded-full cursor-pointer transition-colors duration-200 ${isFocused ? 'bg-slate-100/80 shadow-sm' : 'hover:bg-slate-50'}`}
                            onClick={() => setFocusedField(field.id)}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div className="flex flex-col text-left w-full">
                                <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase mb-0.5">{field.label}</span>
                                <input 
                                    type="text" 
                                    placeholder={field.placeholder}
                                    className="bg-transparent border-none outline-none text-base text-slate-900 placeholder:text-slate-400 w-full focus:ring-0 p-0 font-medium"
                                    onFocus={() => setFocusedField(field.id)}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </div>
                        {index < fields.length - 1 && (
                            <div className="w-px h-10 bg-slate-200 mx-2 hidden md:block" />
                        )}
                    </React.Fragment>
                );
            })}
            
            <button 
                className="w-full md:w-auto h-14 px-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-colors ml-2"
            >
                <Search className="w-5 h-5" />
                <span className="md:hidden">Search</span>
            </button>
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
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={ref} className="relative w-full h-[100vh] min-h-[750px] flex items-center justify-center overflow-hidden bg-black">
            
            {/* Jaw-Dropping Rich Background Image (Like tr1 or tr4) */}
            <motion.div 
                style={{ y, opacity }}
                className="absolute inset-0 z-0 origin-bottom"
            >
                {/* Stunning vibrant beach/coastal image similar to tr4 */}
                <img 
                    src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=3000&auto=format&fit=crop" 
                    alt="Vibrant Coastal Journey" 
                    className="w-full h-[120%] object-cover object-center"
                />
                
                {/* 
                  Subtle elegant gradient to ensure white text pops brilliantly. 
                  Darker at top for navbar, dark at center for headline.
                */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent z-10" />
            </motion.div>

            {/* Content Overlay */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center pt-20">
                
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold text-xs tracking-widest uppercase mb-6 border border-white/30 shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        AI-Powered Travel
                    </span>
                    
                    {/* Massive, pure white, elegant typography */}
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight text-white leading-[1] drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                        Explore <br className="hidden md:block" />
                        The World
                    </h1>
                    
                    <p className="mt-8 text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
                        Experience jaw-dropping destinations curated by sentient AI. Flawless itineraries, spatial booking, and total financial clarity.
                    </p>
                </motion.div>

                <SearchPill />

            </div>
        </section>
    );
};

export default HeroSection;
