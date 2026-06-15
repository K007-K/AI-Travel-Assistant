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
                        {/* Pure CSS Sentient AI Orb Graphic */}
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity duration-1000">
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }} 
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(59,130,246,0.3)_360deg)] rounded-full blur-3xl mix-blend-screen" 
                            />
                            <div className="absolute w-[400px] h-[400px] bg-blue-600/30 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
                            <div className="absolute w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] mix-blend-screen animate-pulse delay-75" />
                            <div className="absolute w-[150px] h-[150px] bg-cyan-400/40 rounded-full blur-[60px] mix-blend-screen animate-pulse delay-150" />
                            
                            {/* Abstract Data Nodes */}
                            <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                        
                        <div className="relative z-10 max-w-xl">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-8 shadow-2xl group-hover:bg-blue-600 transition-colors duration-500">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-4xl md:text-5xl font-display font-black text-white mb-6 leading-tight tracking-tight">
                                Sentient <br/>Orchestration.
                            </h3>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
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
                        
                        {/* Realistic Apple Maps / Google Maps Mockup */}
                        <div className="mt-auto flex-1 w-full bg-[#f4f1ea] rounded-2xl relative overflow-hidden border border-slate-200 shadow-inner group-hover:shadow-md transition-all min-h-[220px]">
                            <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
                                {/* Map Base - Land is #f4f1ea */}
                                {/* Ocean - Pacific (Left side) */}
                                <path d="M 0 0 L 70 0 C 60 80, 110 140, 190 200 L 0 200 Z" fill="#e0eff8" />
                                
                                {/* Parks/Forests (Green areas) */}
                                <path d="M 120 20 Q 150 60 110 90 Q 160 80 170 30 Z" fill="#e2ebd3" />
                                <path d="M 250 120 Q 300 160 260 200 L 350 200 Q 360 140 310 110 Z" fill="#e2ebd3" />

                                {/* Arterial Roads (White lines) */}
                                <path d="M 120 -10 Q 180 100 220 210" stroke="#ffffff" strokeWidth="3" fill="none" />
                                <path d="M -10 80 Q 150 100 410 80" stroke="#ffffff" strokeWidth="2" fill="none" />
                                <path d="M 200 -10 Q 250 100 410 150" stroke="#ffffff" strokeWidth="2" fill="none" />
                                
                                {/* Drop Shadow for Routes */}
                                <defs>
                                    <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.4" />
                                    </filter>
                                </defs>

                                {/* Unoptimized Route 1 (Scenic Coast) */}
                                <motion.path 
                                    d="M 90 50 C 70 90, 130 160, 290 140" 
                                    fill="transparent" 
                                    stroke="#94a3b8" 
                                    strokeWidth="3" 
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.5 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />

                                {/* Unoptimized Route 2 (Inland Detour) */}
                                <motion.path 
                                    d="M 90 50 C 200 10, 320 60, 290 140" 
                                    fill="transparent" 
                                    stroke="#94a3b8" 
                                    strokeWidth="3" 
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.5 }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                />

                                {/* Optimized Route (Direct Highway) - Blue Maps Style */}
                                <motion.path 
                                    d="M 90 50 C 180 70, 220 110, 290 140" 
                                    fill="transparent" 
                                    stroke="#3b82f6" 
                                    strokeWidth="5" 
                                    strokeLinecap="round"
                                    filter="url(#routeGlow)"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 1.2 }}
                                />
                                
                                {/* Animated Moving Packet on optimized route */}
                                <motion.circle 
                                    r="4" 
                                    className="fill-white stroke-blue-600 stroke-[2px] shadow-md"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 1.2, duration: 0.2 }}
                                >
                                    <animateMotion 
                                        dur="2.5s" 
                                        repeatCount="indefinite" 
                                        begin="0s"
                                        path="M 90 50 C 180 70, 220 110, 290 140" 
                                    />
                                </motion.circle>

                                {/* Route Labels (Time) */}
                                <motion.g 
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8, duration: 0.4 }}
                                >
                                    <rect x="175" y="70" width="46" height="20" rx="10" fill="#3b82f6" className="shadow-sm" />
                                    <text x="198" y="84" textAnchor="middle" className="text-[10px] font-bold fill-white">5h 40m</text>
                                </motion.g>

                                {/* Start Location (San Francisco) */}
                                <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                                    <circle cx="90" cy="50" r="6" className="fill-white stroke-slate-900 stroke-[3px]" />
                                    <text x="90" y="35" textAnchor="middle" className="text-[11px] font-black fill-slate-900 tracking-tight" style={{textShadow: "0 1px 2px white, 0 -1px 2px white, 1px 0 2px white, -1px 0 2px white"}}>San Francisco</text>
                                </motion.g>

                                {/* End Location (Los Angeles) */}
                                <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
                                    {/* Maps Pin Icon */}
                                    <path d="M 290 140 C 290 140, 280 128, 280 120 C 280 114.477, 284.477 110, 290 110 C 295.523 110, 300 114.477, 300 120 C 300 128, 290 140, 290 140 Z" className="fill-red-500" />
                                    <circle cx="290" cy="120" r="3" className="fill-white" />
                                    <text x="290" y="155" textAnchor="middle" className="text-[11px] font-black fill-slate-900 tracking-tight" style={{textShadow: "0 1px 2px white, 0 -1px 2px white, 1px 0 2px white, -1px 0 2px white"}}>Los Angeles</text>
                                </motion.g>
                            </svg>
                            
                            {/* Floating UI Element (e.g. "Optimizing Route...") */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-white p-2.5 flex items-center gap-3 z-20"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex flex-col pr-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Route Selected</span>
                                    <span className="text-[13px] font-black text-slate-800 leading-none">Saved 1h 20m</span>
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
