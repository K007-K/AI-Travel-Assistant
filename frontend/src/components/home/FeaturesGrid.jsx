import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Route, Wallet } from 'lucide-react';

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
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-white text-xs font-bold tracking-widest uppercase mb-6 shadow-xl shadow-slate-900/20"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        The Technology
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.05]"
                    >
                        Architected for <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">flawless execution.</span>
                    </motion.h2>
                </div>

                {/* Asymmetrical Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                    
                    {/* Card 1: Sentient AI (Massive Cinematic Card) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="lg:col-span-7 lg:row-span-2 relative bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden min-h-[500px] lg:min-h-[600px] group flex flex-col justify-end p-8 md:p-12 border border-slate-800 shadow-2xl"
                    >
                        {/* Majestic Aura Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {/* Base dark gradient */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0f1115] to-[#050505]" />
                            
                            {/* Soft top-right ambient glow (Deep Blue) */}
                            <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] bg-blue-600/15 rounded-full blur-[120px] mix-blend-screen transition-opacity duration-1000 group-hover:bg-blue-600/20" />
                            
                            {/* Subtle center-left glow (Indigo) */}
                            <div className="absolute top-[10%] left-[10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
                        </div>
                        
                        <div className="relative z-10 max-w-xl">
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-10 shadow-2xl transition-colors duration-500 group-hover:bg-white/[0.05]">
                                <Sparkles className="w-8 h-8 text-white" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-4xl md:text-5xl lg:text-[56px] font-display font-black text-white mb-6 leading-[1.05] tracking-tight">
                                Sentient <br/>Orchestration.
                            </h3>
                            <p className="text-[17px] text-slate-400 font-medium leading-relaxed max-w-[480px]">
                                Powered by Gemini & Groq, our multi-agent engine understands your exact vibe. It negotiates constraints, balances preferences, and generates hyper-personalized, flawless itineraries in milliseconds.
                            </p>
                        </div>
                    </motion.div>

                    {/* Card 2: Routing (Sleek White Card) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="lg:col-span-5 lg:row-span-1 bg-white rounded-[2.5rem] overflow-hidden p-8 border border-slate-200 shadow-xl shadow-slate-200/50 group flex flex-col relative hover:-translate-y-1 transition-transform duration-500"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 text-blue-600">
                            <Route className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Real-World Routing</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8 relative z-10">
                            We use OSRM to calculate actual driving times, instantly evaluating hundreds of paths to select the single most optimized route.
                        </p>
                        
                        {/* Ultra-Realistic Map Mockup */}
                        <div className="mt-auto flex-1 w-full bg-[#f4f5f0] rounded-2xl relative overflow-hidden border border-slate-200 shadow-inner group-hover:shadow-md transition-all min-h-[260px]">
                            <svg viewBox="0 0 600 320" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                                
                                {/* Base land */}
                                <rect width="600" height="320" fill="#f4f5f0" />
                                
                                {/* Ocean on left */}
                                <path d="M 0 0 L 150 0 C 120 150, 200 250, 300 320 L 0 320 Z" fill="#e3f0f8" />
                                
                                {/* Subtle green areas */}
                                <path d="M 350 40 C 400 80, 380 150, 280 200 Z" fill="#dcefd5" opacity="0.6" />
                                <path d="M 450 250 C 500 180, 580 200, 600 280 L 600 320 L 400 320 Z" fill="#dcefd5" opacity="0.6" />

                                {/* White roads */}
                                <path d="M 0 120 Q 300 160, 600 100" stroke="#ffffff" strokeWidth="4" fill="none" />
                                <path d="M 280 0 Q 350 180, 420 320" stroke="#ffffff" strokeWidth="4" fill="none" />
                                
                                {/* Grey Unoptimized Routes (The Ellipse) */}
                                <motion.path 
                                    d="M 180 120 C 260 50, 380 80, 460 210" 
                                    fill="none" 
                                    stroke="#cbd5e1" 
                                    strokeWidth="4" 
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                                <motion.path 
                                    d="M 180 120 C 220 220, 340 260, 460 210" 
                                    fill="none" 
                                    stroke="#cbd5e1" 
                                    strokeWidth="4" 
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                />

                                {/* Blue Optimized Route */}
                                <defs>
                                    <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.4" />
                                    </filter>
                                </defs>
                                <motion.path 
                                    d="M 180 120 L 460 210" 
                                    fill="none" 
                                    stroke="#3b82f6" 
                                    strokeWidth="8" 
                                    strokeLinecap="round"
                                    filter="url(#routeGlow)"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                                />

                                {/* Animated Dot along Blue Route */}
                                <motion.circle 
                                    r="5" 
                                    className="fill-white stroke-blue-600 stroke-[2px] shadow-lg"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 1.2, duration: 0.2 }}
                                >
                                    <animateMotion 
                                        dur="2s" 
                                        repeatCount="indefinite" 
                                        path="M 180 120 L 460 210" 
                                    />
                                </motion.circle>

                                {/* Blue 5h 40m Pill */}
                                <motion.g 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.5, type: "spring" }}
                                >
                                    <rect x="285" y="151" width="70" height="28" rx="14" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                    <text x="320" y="170" textAnchor="middle" className="text-[13px] font-bold fill-white tracking-wide">5h 40m</text>
                                </motion.g>

                                {/* SF Node */}
                                <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                                    <circle cx="180" cy="120" r="12" fill="rgba(0,0,0,0.15)" transform="translate(0, 4)" filter="blur(2px)" />
                                    <circle cx="180" cy="120" r="10" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
                                    <text x="180" y="90" textAnchor="middle" className="text-[16px] font-black fill-slate-900 tracking-tight" style={{textShadow: "0 2px 4px white, 0 -2px 4px white, 2px 0 4px white, -2px 0 4px white, 2px 2px 4px white, -2px -2px 4px white"}}>San Francisco</text>
                                </motion.g>

                                {/* LA Node */}
                                <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
                                    <path d="M 460 210 C 460 210, 445 180, 445 165 C 445 156.7, 451.7 150, 460 150 C 468.3 150, 475 156.7, 475 165 C 475 180, 460 210, 460 210 Z" fill="#ef4444" filter="drop-shadow(0 4px 4px rgba(0,0,0,0.2))" />
                                    <circle cx="460" cy="165" r="5" fill="#ffffff" />
                                    <text x="460" y="240" textAnchor="middle" className="text-[16px] font-black fill-slate-900 tracking-tight" style={{textShadow: "0 2px 4px white, 0 -2px 4px white, 2px 0 4px white, -2px 0 4px white, 2px 2px 4px white, -2px -2px 4px white"}}>Los Angeles</text>
                                </motion.g>

                            </svg>
                            
                            {/* Floating UI Overlay */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white p-3.5 flex items-center gap-4 z-20"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex flex-col pr-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Route Selected</span>
                                    <span className="text-[14px] font-black text-slate-900 leading-none">Saved 1h 20m</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Card 3: Budgeting (Vibrant Gradient Glass Card) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                        className="lg:col-span-5 lg:row-span-1 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-[2.5rem] overflow-hidden p-8 group flex flex-col relative text-white hover:-translate-y-1 transition-transform duration-500 shadow-2xl shadow-blue-500/30"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                        
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-6 text-white shadow-lg">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight drop-shadow-sm">Envelope Budgeting</h3>
                        <p className="text-blue-100 font-medium leading-relaxed mb-8 relative z-10">
                            Total financial clarity. Set a per-person budget, and our engine automatically allocates and balances costs across transport, food, and stays.
                        </p>

                        {/* Pure CSS Glassmorphic UI Element */}
                        <div className="mt-auto w-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 relative z-10 shadow-2xl group-hover:bg-white/15 transition-colors">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-blue-200 text-xs font-bold tracking-wider uppercase mb-1 drop-shadow-sm">Total Trip Cost</p>
                                    <p className="text-4xl font-black drop-shadow-md">$2,450</p>
                                </div>
                                <div className="px-3 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold flex items-center">
                                    Within Budget
                                </div>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "75%" }}
                                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                                    className="bg-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(52,211,153,0.6)] relative"
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
