import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Route, Wallet } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
    {
        id: 'ai-engine',
        title: 'Sentient AI Orchestration',
        description: 'Powered by Gemini & Groq, our multi-agent engine understands your exact vibe and generates hyper-personalized, flawless itineraries in seconds.',
        icon: Sparkles,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop',
        span: 'md:col-span-2 md:row-span-2',
        aspect: 'aspect-square md:aspect-[2/1]'
    },
    {
        id: 'osrm-routing',
        title: 'Real-World Routing',
        description: 'No more guessing. We use OSRM to calculate actual driving times, instantly detecting and optimizing for overnight travel.',
        icon: Route,
        image: 'https://images.unsplash.com/photo-1517322048670-4fba75c1855f?q=80&w=1000&auto=format&fit=crop',
        span: 'md:col-span-1 md:row-span-1',
        aspect: 'aspect-square'
    },
    {
        id: 'smart-budget',
        title: 'Envelope Budgeting',
        description: 'Total financial clarity. Set a per-person budget, and our engine automatically allocates costs across transport, food, and stays.',
        icon: Wallet,
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop',
        span: 'md:col-span-1 md:row-span-1',
        aspect: 'aspect-square'
    }
];

const FeaturesGrid = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.feature-card');
            
            gsap.set(cards, { y: 60, opacity: 0, scale: 0.95 });

            ScrollTrigger.batch(cards, {
                start: "top 80%",
                onEnter: (elements) => {
                    gsap.to(elements, {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 1,
                        stagger: 0.15,
                        ease: "power3.out",
                        overwrite: true
                    });
                },
                onLeaveBack: (elements) => {
                    gsap.set(elements, { y: 60, opacity: 0, scale: 0.95, overwrite: true });
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="w-full bg-[#fafafa] py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header Section */}
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-bold text-[11px] tracking-widest uppercase mb-4 block">
                        The Engine
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 tracking-tight max-w-3xl mx-auto leading-[1.1]">
                        Architected for flawless execution.
                    </h2>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {FEATURES.map((feature) => (
                        <div 
                            key={feature.id}
                            className={`feature-card group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 flex flex-col ${feature.span}`}
                        >
                            {/* Edge-to-Edge Image */}
                            <div className={`relative w-full ${feature.aspect} overflow-hidden`}>
                                <img 
                                    src={feature.image} 
                                    alt={feature.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                {/* Elegant dark gradient overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                                
                                {/* Content placed over the image */}
                                <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 flex flex-col justify-end h-full">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-blue-600 transition-colors duration-500">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 leading-tight tracking-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed max-w-lg">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
