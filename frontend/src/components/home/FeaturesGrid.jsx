import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Route, Wallet } from 'lucide-react';

const FEATURES = [
    {
        id: 'ai-engine',
        title: 'Sentient Orchestration',
        description: 'Our multi-agent engine understands your exact vibe, instantly generating hyper-personalized itineraries.',
        icon: Sparkles,
        image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1000&auto=format&fit=crop',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
    },
    {
        id: 'osrm-routing',
        title: 'Real-World Routing',
        description: 'Actual driving times via OSRM. We instantly detect and optimize for overnight travel to save you days.',
        icon: Route,
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
    },
    {
        id: 'smart-budget',
        title: 'Envelope Budgeting',
        description: 'Total financial clarity. Set a per-person budget, and our engine automatically allocates all costs.',
        icon: Wallet,
        image: 'https://images.unsplash.com/photo-1495474472205-16284eb86b5c?q=80&w=1000&auto=format&fit=crop',
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-600',
    }
];

const FeaturesGrid = () => {
    return (
        <section className="w-full bg-[#fafafa] py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Header Section */}
                <div className="text-center mb-20">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        The Technology
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]"
                    >
                        Architected for flawless execution.
                    </motion.h2>
                </div>

                {/* 3-Column Uniform Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {FEATURES.map((feature, index) => (
                        <motion.div 
                            key={feature.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
                            className="feature-card group bg-white rounded-[2rem] overflow-hidden border border-slate-100/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-500 flex flex-col"
                        >
                            {/* Top Image Section */}
                            <div className="relative w-full h-56 md:h-64 overflow-hidden bg-slate-100 flex-shrink-0">
                                <img 
                                    src={feature.image} 
                                    alt={feature.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors duration-700" />
                            </div>

                            {/* Bottom Content Section */}
                            <div className="p-8 md:p-10 flex flex-col flex-1 bg-white">
                                {/* Integrated Icon Badge */}
                                <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-6 shadow-sm border border-white group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                
                                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-500 text-[15px] font-medium leading-relaxed flex-1">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
