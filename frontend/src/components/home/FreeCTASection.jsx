import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const FreeCTASection = () => {
    return (
        <section id="join" className="w-full bg-[#030712] py-32 md:py-48 overflow-hidden relative border-t border-white/[0.05]">
            
            {/* Immersive Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[200px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            {/* Subtle Grid Pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-blue-300 text-xs font-bold tracking-widest uppercase mb-8 backdrop-blur-md"
                >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Zero Paywalls. Zero Hidden Fees.
                </motion.div>

                <motion.h2 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-5xl md:text-7xl lg:text-[100px] leading-[0.9] font-display font-black text-white tracking-tighter mb-8 drop-shadow-2xl flex flex-col"
                >
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                        100% Free.
                    </span>
                    <span className="font-serif font-light italic text-blue-400 mt-2 md:-mt-2">
                        Forever.
                    </span>
                </motion.h2>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-lg md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed mb-12"
                >
                    Everything you need to orchestrate flawless travel. Completely free, engineered for everyone.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                >
                    <Link to="/signup">
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(59,130,246,0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-colors duration-300 group"
                        >
                            <Sparkles className="w-5 h-5 text-blue-600 group-hover:animate-pulse" />
                            Create Your Free Account
                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Micro-assurances */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="mt-16 flex items-center justify-center gap-8 text-sm font-medium text-slate-500"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        No credit card required
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        Unlimited Trips
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                        Full AI Access
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default FreeCTASection;
