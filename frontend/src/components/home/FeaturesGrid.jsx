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
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop',
        span: 'md:col-span-2 md:row-span-1',
    },
    {
        id: 'osrm-routing',
        title: 'Real-World Routing',
        description: 'We use OSRM to calculate actual driving times, instantly detecting and optimizing for overnight travel. No more guesswork.',
        icon: Route,
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop',
        span: 'md:col-span-1 md:row-span-1',
    },
    {
        id: 'smart-budget',
        title: 'Envelope Budgeting',
        description: 'Total financial clarity. Set a per-person budget, and our engine automatically allocates costs across transport, food, and stays.',
        icon: Wallet,
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop',
        span: 'md:col-span-1 md:row-span-1',
    }
];

const FeaturesGrid = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.feature-card');
            
            gsap.set(cards, { y: 40, opacity: 0, scale: 0.98 });

            ScrollTrigger.batch(cards, {
                start: "top 85%",
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
                    gsap.set(elements, { y: 40, opacity: 0, scale: 0.98, overwrite: true });
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="w-full bg-[#fafafa] py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header Section */}
                <div className="text-center mb-20">
                    <span className="text-blue-600 font-bold text-[11px] tracking-widest uppercase mb-4 block">
                        The Technology
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 tracking-tight max-w-3xl mx-auto leading-[1.1]">
                        Architected for flawless execution.
                    </h2>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto auto-rows-fr">
                    {FEATURES.map((feature) => (
                        <div 
                            key={feature.id}
                            className={`feature-card group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] transition-shadow duration-500 flex flex-col ${feature.span}`}
                        >
                            {/* Top Image Section (Edge-to-Edge) */}
                            <div className="relative w-full h-48 md:h-64 overflow-hidden bg-slate-100 flex-shrink-0">
                                <img 
                                    src={feature.image} 
                                    alt={feature.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500" />
                            </div>

                            {/* Bottom Content Section (Clean White) */}
                            <div className="p-8 md:p-10 flex flex-col flex-1 bg-white">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors duration-300 shadow-sm">
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed flex-1">
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
