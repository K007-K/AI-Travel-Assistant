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
                            We use OSRM to calculate actual driving times, detecting and optimizing for overnight travel. No more guesswork or missed connections.
                        </p>
                        
                        {/* Pure CSS Routing UI Mockup */}
                        <div className="mt-auto flex-1 w-full bg-[#f8fafc] rounded-2xl p-6 relative overflow-hidden border border-slate-100 flex flex-col justify-center gap-6 group-hover:shadow-inner transition-all">
                            <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg z-10">A</div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start</span>
                                </div>
                                <div className="flex-1 h-1 bg-slate-200 rounded-full relative">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        whileInView={{ width: "100%" }} 
                                        transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }} 
                                        className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                    />
                                    {/* Moving dot */}
                                    <motion.div
                                        initial={{ left: 0 }}
                                        whileInView={{ left: "100%" }}
                                        transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-emerald-500 rounded-full shadow-md -ml-1.5"
                                    />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 z-10">B</div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End</span>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />
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
