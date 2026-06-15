import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Sparkles } from 'lucide-react';

const SearchPill = () => {
    const [focusedField, setFocusedField] = useState(null);

    const fields = [
        { id: 'where', icon: MapPin, label: 'Where to?', placeholder: 'Search destinations' },
        { id: 'when', icon: Calendar, label: 'When?', placeholder: 'Add dates' },
        { id: 'who', icon: Users, label: 'Who?', placeholder: 'Add guests' }
    ];

    return (
        <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto mt-16 bg-white/70 backdrop-blur-2xl rounded-full p-2 border border-white/60 shadow-xl flex flex-col md:flex-row items-center gap-2 relative z-20"
        >
            {fields.map((field, index) => {
                const Icon = field.icon;
                const isFocused = focusedField === field.id;
                
                return (
                    <React.Fragment key={field.id}>
                        <div 
                            className={`flex-1 flex items-center gap-4 px-6 py-4 rounded-full cursor-pointer transition-all duration-300 ${isFocused ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                            onClick={() => setFocusedField(field.id)}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isFocused ? 'text-slate-900' : 'text-slate-400'}`} />
                            <div className="flex flex-col text-left w-full">
                                <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-0.5">{field.label}</span>
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
                            <div className="w-px h-10 bg-slate-200/60 hidden md:block" />
                        )}
                    </React.Fragment>
                );
            })}
            
            <button 
                className="w-full md:w-auto h-16 px-10 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center gap-3 shadow-md hover:bg-black transition-colors"
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
    
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={ref} className="relative w-full h-[100vh] min-h-[800px] flex items-center justify-center overflow-hidden bg-[#fafafa]">
            
            {/* Minimalist, bright, airy architectural background */}
            <motion.div 
                style={{ y, opacity }}
                className="absolute inset-0 z-0 origin-bottom"
            >
                <img 
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=3000&auto=format&fit=crop" 
                    alt="Luxury Minimalist Architecture" 
                    className="w-full h-[120%] object-cover object-center"
                />
                
                {/* 
                  Instead of dark gradients, we use a very soft white gradient 
                  to wash out the image slightly, making dark text perfectly readable 
                  and enforcing an ultra-luxury, high-end light theme.
                */}
                <div className="absolute inset-0 bg-white/30 z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-transparent to-transparent z-10" />
            </motion.div>

            {/* Content Overlay */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center pt-24">
                
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md text-slate-800 font-semibold text-xs tracking-widest uppercase mb-8 border border-white/60">
                        <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                        The New Standard
                    </span>
                    
                    {/* Stark, crisp, dark typography on a bright background */}
                    <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-display font-bold tracking-tight text-slate-900 leading-[0.95]">
                        Explore with <br className="hidden md:block" />
                        <span className="relative inline-block">
                            absolute clarity.
                            <div className="absolute bottom-2 left-0 right-0 h-4 bg-slate-200/50 -z-10 rounded-full" />
                        </span>
                    </h1>
                    
                    <p className="mt-8 text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        Experience jaw-dropping destinations curated by sentient AI. Flawless itineraries, spatial booking, and total financial clarity.
                    </p>
                </motion.div>

                <SearchPill />

            </div>
        </section>
    );
};

export default HeroSection;
