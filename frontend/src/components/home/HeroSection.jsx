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
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4, type: 'spring', stiffness: 80, damping: 20 }}
            className="w-full max-w-4xl mx-auto mt-16 bg-white/60 backdrop-blur-[40px] rounded-[2.5rem] p-3 border border-white/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col md:flex-row items-center gap-2 relative z-20 group"
        >
            {fields.map((field, index) => {
                const Icon = field.icon;
                const isFocused = focusedField === field.id;
                
                return (
                    <React.Fragment key={field.id}>
                        <motion.div 
                            className={`flex-1 flex items-center gap-4 px-6 py-4 rounded-full cursor-pointer transition-all duration-300 relative ${isFocused ? 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]' : 'hover:bg-white/40'}`}
                            onClick={() => setFocusedField(field.id)}
                            layout
                        >
                            <div className={`p-2 rounded-full transition-colors duration-300 ${isFocused ? 'bg-blue-50' : 'bg-slate-100/50'}`}>
                                <Icon className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-blue-600' : 'text-slate-500'}`} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-black text-slate-800 tracking-wider uppercase">{field.label}</span>
                                <input 
                                    type="text" 
                                    placeholder={field.placeholder}
                                    className="bg-transparent border-none outline-none text-base text-slate-900 placeholder:text-slate-400 w-full focus:ring-0 p-0 font-medium"
                                    onFocus={() => setFocusedField(field.id)}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </motion.div>
                        {index < fields.length - 1 && (
                            <div className="w-px h-12 bg-slate-300/50 hidden md:block" />
                        )}
                    </React.Fragment>
                );
            })}
            
            <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full md:w-auto h-[72px] px-10 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-3 shadow-[0_15px_30px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(59,130,246,0.5)] transition-all border border-blue-400/30"
            >
                <Search className="w-6 h-6" />
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
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <section ref={ref} className="relative w-full h-[100vh] min-h-[800px] flex items-center justify-center overflow-hidden bg-[#fafafa]">
            
            {/* Jaw-Dropping Parallax Background Image */}
            <motion.div 
                style={{ y, scale, opacity }}
                className="absolute inset-0 z-0 origin-bottom"
            >
                <img 
                    src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=3000&auto=format&fit=crop" 
                    alt="Stunning Coastal Architecture" 
                    className="w-full h-[120%] object-cover object-center"
                />
                
                {/* 
                  Enhanced Gradient Overlay: 
                  We need a slightly darker top for the white text to pop, 
                  but we keep the overall vibe bright and airy.
                */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-[#fafafa] z-10 mix-blend-multiply opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafafa] z-10" />
            </motion.div>

            {/* Content Overlay */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center pt-32">
                
                <motion.div
                    initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-sm mb-8 border border-white/30 shadow-[0_8px_16px_rgba(0,0,0,0.1)] uppercase tracking-wider"
                    >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        The New Standard of Travel
                    </motion.span>
                    
                    {/* Fixed Contrast & Readability on Typography */}
                    <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-display font-black tracking-tighter text-white leading-[0.95] drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                        Explore with <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-white drop-shadow-none relative">
                            absolute clarity.
                            <div className="absolute -inset-x-4 inset-y-0 bg-white/10 blur-2xl -z-10 rounded-full" />
                        </span>
                    </h1>
                    
                    <p className="mt-8 text-xl md:text-2xl text-white max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                        Experience jaw-dropping destinations curated by sentient AI. Flawless itineraries, spatial booking, and total financial clarity.
                    </p>
                </motion.div>

                <SearchPill />

            </div>
        </section>
    );
};

export default HeroSection;
