import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Route, Wallet } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
    {
        id: 'ai-engine',
        title: 'Sentient Orchestration',
        description: 'Our multi-agent engine understands your exact vibe, instantly generating hyper-personalized itineraries.',
        icon: Sparkles,
        image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1000&auto=format&fit=crop', // Pristine resort
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
    },
    {
        id: 'osrm-routing',
        title: 'Real-World Routing',
        description: 'Actual driving times via OSRM. We instantly detect and optimize for overnight travel to save you days.',
        icon: Route,
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop', // Beautiful road
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
    },
    {
        id: 'smart-budget',
        title: 'Envelope Budgeting',
        description: 'Total financial clarity. Set a per-person budget, and our engine automatically allocates all costs.',
        icon: Wallet,
        image: 'https://images.unsplash.com/photo-1495474472205-16284eb86b5c?q=80&w=1000&auto=format&fit=crop', // Chic cafe/journal
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-600',
    }
];

const FeaturesGrid = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.feature-card');
            
            gsap.set(cards, { y: 50, opacity: 0, filter: 'blur(10px)' });

            ScrollTrigger.batch(cards, {
                start: "top 80%",
                onEnter: (elements) => {
                    gsap.to(elements, {
                        y: 0,
                        opacity: 1,
                        filter: 'blur(0px)',
                        duration: 1.2,
                        stagger: 0.2,
                        ease: "power3.out",
                        overwrite: true
                    });
                },
                onLeaveBack: (elements) => {
                    gsap.set(elements, { y: 50, opacity: 0, filter: 'blur(10px)', overwrite: true });
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="w-full bg-[#fafafa] py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header Section */}
                <div className="text-center mb-24">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        The Technology
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-display font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
                        Architected for flawless execution.
                    </h2>
                </div>

                {/* 3-Column Uniform Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {FEATURES.map((feature) => (
                        <div 
                            key={feature.id}
                            className="feature-card group bg-white rounded-[2rem] overflow-hidden border border-slate-100/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 flex flex-col hover:-translate-y-2"
                        >
                            {/* Top Image Section */}
                            <div className="relative w-full h-64 overflow-hidden bg-slate-100 flex-shrink-0">
                                <img 
                                    src={feature.image} 
                                    alt={feature.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors duration-700" />
                            </div>

                            {/* Bottom Content Section */}
                            <div className="p-8 md:p-10 flex flex-col flex-1 bg-white relative">
                                {/* Floating Premium Icon */}
                                <div className={`absolute -top-8 left-8 w-16 h-16 rounded-2xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center shadow-lg border border-white group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                
                                <h3 className="text-2xl font-black text-slate-900 mb-4 mt-6 tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-500 text-[15px] font-medium leading-relaxed flex-1">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
