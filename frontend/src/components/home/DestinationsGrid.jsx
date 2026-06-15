import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, CalendarDays, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FILTERS = ['All', 'Resort', 'Villa', 'Hotel', 'Cottage', 'Homestay', 'Guesthouse', 'Eco Lodge'];

const DESTINATIONS = [
    {
        id: 1,
        title: 'Special Tour to Wates Beach Tourism',
        location: 'Rembang, Indonesia',
        image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000&auto=format&fit=crop',
        rating: 4.9,
        dates: '8 Jul - 12 Jul',
        price: '$1,580',
        duration: '9-day package',
        type: 'Resort'
    },
    {
        id: 2,
        title: 'Akar Bayang Mande Beach Tourism',
        location: 'Banyuwangi, Indonesia',
        image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000&auto=format&fit=crop',
        rating: 4.9,
        dates: '8 Jul - 12 Jul',
        price: '$1,430',
        duration: '12-day package',
        type: 'Villa'
    },
    {
        id: 3,
        title: 'Special Tourism Karangjahe Beach',
        location: 'Banyuwangi, Indonesia',
        image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2000&auto=format&fit=crop',
        rating: 4.9,
        dates: '8 Jul - 12 Jul',
        price: '$1,210',
        duration: '7-day package',
        type: 'Eco Lodge'
    }
];

const DestinationsGrid = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const sectionRef = useRef(null);
    const gridRef = useRef(null);

    // GSAP Blooming Animation
    useEffect(() => {
        let ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.dest-card');
            
            // Set initial state
            gsap.set(cards, { y: 100, opacity: 0, scale: 0.95, filter: 'blur(10px)' });

            ScrollTrigger.batch(cards, {
                start: "top 85%",
                onEnter: (elements) => {
                    gsap.to(elements, {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        filter: 'blur(0px)',
                        duration: 1.2,
                        stagger: 0.15,
                        ease: "power3.out",
                        overwrite: true
                    });
                },
                onLeaveBack: (elements) => {
                    gsap.set(elements, { y: 100, opacity: 0, scale: 0.95, filter: 'blur(10px)', overwrite: true });
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, [activeFilter]); // Re-run animation setup when filter changes

    const filteredDestinations = activeFilter === 'All' 
        ? DESTINATIONS 
        : DESTINATIONS.filter(d => d.type === activeFilter);

    return (
        <section ref={sectionRef} className="w-full bg-[#fafafa] py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header Section */}
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-bold text-[11px] tracking-widest uppercase mb-4 block">
                        Explore Popular Package
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 tracking-tight max-w-3xl mx-auto leading-[1.1]">
                        What we offer is an unforgettable journey and experience.
                    </h2>
                </div>

                {/* Filter Pill UI */}
                <div className="flex justify-center mb-16">
                    <div className="flex flex-wrap items-center justify-center gap-2 bg-white rounded-full p-2 shadow-sm border border-slate-100">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                                    activeFilter === filter ? 'text-white' : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {activeFilter === filter && (
                                    <motion.div
                                        layoutId="active-filter"
                                        className="absolute inset-0 bg-blue-500 rounded-full shadow-md shadow-blue-500/20"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{filter}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredDestinations.map((dest) => (
                            <motion.div 
                                key={dest.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5 }}
                                className="dest-card bg-white rounded-[2rem] p-4 border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-500 group flex flex-col"
                            >
                                {/* Image Container */}
                                <div className="relative w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden mb-6">
                                    <img 
                                        src={dest.image} 
                                        alt={dest.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                </div>

                                {/* Content */}
                                <div className="px-2 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                                        {dest.title}
                                    </h3>
                                    
                                    <div className="flex items-center gap-2 text-slate-500 mb-6">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">{dest.location}</span>
                                    </div>

                                    {/* Micro-data row */}
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 mb-8 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                                            <span>Round trip</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                                            <span>{dest.rating} rating</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                                            <span>{dest.dates}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Row */}
                                    <div className="mt-auto flex items-end justify-between pt-6 border-t border-slate-100">
                                        <div>
                                            <div className="text-2xl font-bold text-slate-900">{dest.price}</div>
                                            <div className="text-xs font-medium text-slate-400 mt-1">{dest.duration}</div>
                                        </div>
                                        <button className="px-8 py-3 rounded-full bg-slate-50 text-slate-900 font-bold text-sm hover:bg-slate-900 hover:text-white transition-colors duration-300 ring-1 ring-slate-200 hover:ring-slate-900">
                                            Book
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                
                <div className="mt-16 flex justify-center">
                    <button className="px-8 py-3 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2">
                        Explore more
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DestinationsGrid;
