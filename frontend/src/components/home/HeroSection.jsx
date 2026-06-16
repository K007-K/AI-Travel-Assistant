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
                            className={`flex-1 flex items-center gap-4 px-6 py-3.5 rounded-full cursor-pointer transition-all duration-400 relative group ${isFocused ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100 scale-[1.02] z-10' : 'hover:bg-slate-50 hover:shadow-sm'}`}
                            onClick={() => setFocusedField(field.id)}
                        >
                            <div className={`p-2 rounded-full transition-all duration-400 ${isFocused ? 'bg-blue-50 scale-110' : 'bg-slate-100/50 group-hover:bg-blue-50/50 group-hover:scale-110'}`}>
                                <Icon className={`w-5 h-5 transition-colors duration-400 ${isFocused ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
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
                whileHover={{ scale: 1.04, boxShadow: "0 20px 40px -10px rgba(59,130,246,0.6)" }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-colors duration-300 group"
            >
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                Start Planning
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
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
                        className="text-[100px] md:text-[140px] lg:text-[180px] leading-[0.85] tracking-tighter text-white mb-6 flex flex-col items-center justify-center drop-shadow-2xl group cursor-default"
                    >
                        <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 group-hover:to-white transition-all duration-700">
                            Travel without
                        </span>
                        <span className="font-serif font-light italic text-[90px] md:text-[130px] lg:text-[160px] -mt-4 md:-mt-8 text-white/90 group-hover:text-white transition-all duration-700 group-hover:scale-105 transform origin-center">
                            stress.
                        </span>
                    </motion.h1>
                    
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
