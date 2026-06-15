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
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 text-emerald-600">
                            <Route className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Real-World Routing</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8 relative z-10">
                            We use OSRM to calculate actual driving times, instantly evaluating hundreds of paths to select the single most optimized route.
                        </p>
                        
                        {/* Pure SVG Map Optimization Animation */}
                        <div className="mt-auto flex-1 w-full bg-[#f8fafc] rounded-2xl p-4 relative overflow-hidden border border-slate-100 flex items-center justify-center group-hover:shadow-inner transition-all min-h-[180px]">
                            {/* Subtle Map Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                            
                            <svg viewBox="0 0 400 160" className="w-full h-full relative z-10 overflow-visible">
                                <defs>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Unoptimized Route 1 (Wavy/Long) */}
                                <motion.path 
                                    d="M 50 80 Q 120 10, 200 40 T 350 80" 
                                    fill="transparent" 
                                    strokeWidth="2" 
                                    strokeDasharray="6 6"
                                    strokeLinecap="round"
                                    className="stroke-slate-300"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.3 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />

                                {/* Unoptimized Route 2 (Jagged) */}
                                <motion.path 
                                    d="M 50 80 L 120 130 L 220 110 L 280 140 L 350 80" 
                                    fill="transparent" 
                                    strokeWidth="2" 
                                    strokeDasharray="6 6"
                                    strokeLinejoin="round"
                                    className="stroke-slate-300"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 0.3 }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                />

                                {/* Optimized Route (Smooth, Direct) */}
                                <motion.path 
                                    d="M 50 80 Q 200 120, 350 80" 
                                    fill="transparent" 
                                    strokeWidth="4" 
                                    strokeLinecap="round"
                                    className="stroke-emerald-500"
                                    filter="url(#glow)"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 1.2 }}
                                />

                                {/* Animated Packet on Optimized Route */}
                                <motion.circle 
                                    r="4" 
                                    className="fill-white stroke-emerald-500 stroke-[2px]"
                                    initial={{ opacity: 0, offsetDistance: "0%" }}
                                    whileInView={{ opacity: 1, offsetDistance: "100%" }}
                                    transition={{ 
                                        opacity: { delay: 1.2, duration: 0.2 },
                                        offsetDistance: { delay: 1.2, duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }
                                    }}
                                    style={{ 
                                        offsetPath: "path('M 50 80 Q 200 120, 350 80')",
                                    }}
                                />

                                {/* Node A (Start) */}
                                <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                                    <circle cx="50" cy="80" r="14" className="fill-slate-900 shadow-lg" />
                                    <text x="50" y="84" textAnchor="middle" className="text-[12px] font-bold fill-white">A</text>
                                    <text x="50" y="110" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest">Start</text>
                                </motion.g>

                                {/* Node B (End) */}
                                <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
                                    <circle cx="350" cy="80" r="14" className="fill-emerald-500 shadow-lg" />
                                    <text x="350" y="84" textAnchor="middle" className="text-[12px] font-bold fill-white">B</text>
                                    <text x="350" y="110" textAnchor="middle" className="text-[10px] font-bold fill-emerald-600 uppercase tracking-widest">End</text>
                                </motion.g>

                            </svg>
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
