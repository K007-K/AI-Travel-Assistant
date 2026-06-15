import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Route, Wallet, Loader2, MessageSquare, Cpu, Calendar } from 'lucide-react';

const ghostCodeLines = [
    "[System] Analyzing travel intent...",
    "[DB] Querying tokyo ryokans...",
    "[API] Calculating optimal routes...",
    "[Agent] Negotiating budget...",
    "[Engine] Generating itinerary..."
];

const FeaturesGrid = () => {
    const [animState, setAnimState] = useState(0);
    const fullText = "5 days in Tokyo. Luxury, relaxed pace, authentic omakase...";
    const [typedText, setTypedText] = useState("");

    useEffect(() => {
        // State 0: Typing (0-2.5s)
        // State 1: Send Packet In (2.5s-3.3s)
        // State 2: Packet Down (3.3s-3.9s)
        // State 3: Processing / Ghost Code (3.9s-6.4s)
        // State 4: Packet Up (6.4s-7.0s)
        // State 5: Send Packet Out (7.0s-7.8s)
        // State 6: Output Reveal & Hold (7.8s-10.8s)
        let isMounted = true;
        const sequence = async () => {
            while (isMounted) {
                setAnimState(0);
                await new Promise(r => setTimeout(r, 2500));
                if(!isMounted) break;
                setAnimState(1);
                await new Promise(r => setTimeout(r, 800));
                if(!isMounted) break;
                setAnimState(2);
                await new Promise(r => setTimeout(r, 600));
                if(!isMounted) break;
                setAnimState(3);
                await new Promise(r => setTimeout(r, 3500)); // Increased to allow Ghost Code to finish
                if(!isMounted) break;
                setAnimState(4);
                await new Promise(r => setTimeout(r, 600));
                if(!isMounted) break;
                setAnimState(5);
                await new Promise(r => setTimeout(r, 800));
                if(!isMounted) break;
                setAnimState(6);
                await new Promise(r => setTimeout(r, 3000));
            }
        };
        sequence();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (animState === 0) {
            setTypedText("");
            let i = 0;
            const interval = setInterval(() => {
                setTypedText(fullText.substring(0, i));
                i++;
                if (i > fullText.length) clearInterval(interval);
            }, 35);
            return () => clearInterval(interval);
        } else if (animState > 0) {
            setTypedText(fullText);
        }
    }, [animState]);

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
                        className="lg:col-span-7 lg:row-span-2 relative bg-white rounded-[2.5rem] overflow-hidden min-h-[500px] lg:min-h-[600px] group flex flex-col justify-between p-8 md:p-12 border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500"
                    >
                        {/* UI Graphic: Engine Pipeline */}
                        <div className="w-full flex-1 flex flex-col items-center justify-start pt-6 pb-8 z-10 relative min-h-[300px]">
                            {/* Subtle background grid for technical feel */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80 pointer-events-none" />

                            <div className="w-full max-w-3xl grid grid-cols-3 gap-8 items-start relative z-10 mt-4">
                                
                                {/* Connecting lines (Only in gaps) */}
                                <div className="absolute top-[75px] left-[25%] w-[15%] h-[2px] bg-slate-200 -z-10" />
                                <div className="absolute top-[75px] left-[60%] w-[15%] h-[2px] bg-slate-200 -z-10" />
                                <div className="absolute top-[170px] left-1/2 w-[2px] h-[130px] bg-gradient-to-b from-slate-200 to-transparent -z-10 -translate-x-1/2" />
                                
                                {/* Pulsing rings (Centered on the Engine Node body) */}
                                <div className={`absolute top-[100px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-blue-500/15 rounded-full transition-all duration-1000 pointer-events-none z-0 ${animState >= 1 && animState <= 5 ? 'animate-ping opacity-100' : 'opacity-0'}`} style={{ animationDuration: '3s' }} />
                                <div className={`absolute top-[100px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] bg-indigo-500/15 rounded-full transition-all duration-1000 pointer-events-none z-0 ${animState >= 1 && animState <= 5 ? 'animate-ping opacity-100' : 'opacity-0'}`} style={{ animationDuration: '2s' }} />
                                
                                {/* Animated Data Packets */}
                                <AnimatePresence>
                                    {/* Input to Engine */}
                                    {animState === 1 && (
                                        <motion.div 
                                            key="packet-1"
                                            initial={{ left: "26%", top: "75px", opacity: 0 }}
                                            animate={{ left: "40%", opacity: [0, 1, 1, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8, ease: "easeIn" }}
                                            className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,1)] z-20 -translate-y-1/2" 
                                        />
                                    )}
                                    {/* Engine Down to Ghost Code */}
                                    {animState === 2 && (
                                        <motion.div 
                                            key="packet-2"
                                            initial={{ left: "50%", top: "180px", opacity: 0 }}
                                            animate={{ top: "300px", opacity: [0, 1, 1, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,1)] z-20 -translate-x-1/2" 
                                        />
                                    )}
                                    {/* Ghost Code Up to Engine */}
                                    {animState === 4 && (
                                        <motion.div 
                                            key="packet-4"
                                            initial={{ left: "50%", top: "300px", opacity: 0 }}
                                            animate={{ top: "180px", opacity: [0, 1, 1, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.6, ease: "easeIn" }}
                                            className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,1)] z-20 -translate-x-1/2" 
                                        />
                                    )}
                                    {/* Engine to Output */}
                                    {animState === 5 && (
                                        <motion.div 
                                            key="packet-5"
                                            initial={{ left: "60%", top: "75px", opacity: 0 }}
                                            animate={{ left: "74%", opacity: [0, 1, 1, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,1)] z-20 -translate-y-1/2" 
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Node 1: Request */}
                                <motion.div 
                                    className={`mt-8 bg-white border-2 rounded-[1.5rem] p-6 flex flex-col gap-4 shadow-sm relative transition-all duration-500 ${animState === 0 ? 'border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-105' : 'border-slate-100'}`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${animState === 0 ? 'bg-blue-50' : 'bg-slate-100'}`}>
                                            <MessageSquare className={`w-4 h-4 transition-colors ${animState === 0 ? 'text-blue-600' : 'text-slate-500'}`} />
                                        </div>
                                        <span className={`text-[12px] font-bold uppercase tracking-wider transition-colors ${animState === 0 ? 'text-blue-600' : 'text-slate-400'}`}>Input</span>
                                    </div>
                                    <div className={`rounded-xl p-4 border transition-colors ${animState === 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                                        <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic min-h-[60px]">
                                            "{typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-[2px] h-[1em] bg-blue-500 align-middle ml-1"></motion.span>"
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Node 2: Gemini & Groq (The Engine) */}
                                <div className="relative flex justify-center mt-4">
                                    <div className={`bg-white border-2 rounded-[2rem] p-1.5 relative z-10 w-[180px] h-[167px] transition-all duration-500 ${animState >= 1 && animState <= 5 ? 'border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.3)] scale-105' : 'border-slate-100 shadow-[0_0_20px_rgba(59,130,246,0.05)]'}`}>
                                        <div className="bg-gradient-to-b from-slate-50 to-white rounded-[1.6rem] p-6 flex flex-col items-center justify-center gap-4 relative z-10 h-full">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                                                <Cpu className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="flex flex-col items-center text-center">
                                                <span className="text-[15px] font-black text-slate-900 tracking-tight leading-none mb-1.5">Gemini<br/>& Groq</span>
                                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Engine</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ghost Code Space */}
                                    <div className="absolute top-[300px] left-1/2 -translate-x-1/2 w-[300px] flex flex-col gap-2 items-center pointer-events-none z-10">
                                        <AnimatePresence>
                                            {animState === 3 && ghostCodeLines.map((line, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                                    exit={{ opacity: 0, filter: "blur(4px)" }}
                                                    transition={{ duration: 0.6, delay: i * 0.4, ease: "easeOut" }}
                                                    className="text-[12px] font-mono font-bold text-slate-500 whitespace-nowrap"
                                                >
                                                    {line}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Node 3: Response (Itinerary) */}
                                <motion.div 
                                    className={`mt-8 bg-white border-2 rounded-[1.5rem] p-6 flex flex-col gap-4 shadow-sm relative transition-all duration-500 ${animState === 6 ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-105' : 'border-slate-100'}`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${animState === 6 ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                                            <Calendar className={`w-4 h-4 transition-colors ${animState === 6 ? 'text-emerald-600' : 'text-slate-500'}`} />
                                        </div>
                                        <span className={`text-[12px] font-bold uppercase tracking-wider transition-colors ${animState === 6 ? 'text-emerald-600' : 'text-slate-400'}`}>Output</span>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Output Block 1 */}
                                        <div className={`h-12 w-full rounded-xl border flex items-center px-4 gap-3 transition-colors duration-500 ${animState === 6 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className={`w-7 h-7 rounded-md shrink-0 transition-colors duration-500 ${animState === 6 ? 'bg-emerald-200/50' : 'bg-slate-200'}`} />
                                            <div className="flex-1 space-y-2 relative">
                                                <AnimatePresence mode="wait">
                                                    {animState === 6 ? (
                                                        <motion.div key="data1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-slate-700 leading-none">Aman Tokyo Ryokan</span>
                                                            <span className="text-[9px] font-medium text-emerald-600 leading-none">Booked • $850/nt</span>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div key="skel1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                                                            <div className="h-2 w-full bg-slate-200 rounded-full" />
                                                            <div className="h-2 w-2/3 bg-slate-200 rounded-full" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        {/* Output Block 2 */}
                                        <div className={`h-12 w-full rounded-xl border flex items-center px-4 gap-3 transition-all duration-500 ${animState === 6 ? 'bg-blue-50/50 border-blue-100 opacity-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                                            <div className={`w-7 h-7 rounded-md shrink-0 transition-colors duration-500 ${animState === 6 ? 'bg-blue-200/50' : 'bg-slate-200'}`} />
                                            <div className="flex-1 space-y-2 relative">
                                                <AnimatePresence mode="wait">
                                                    {animState === 6 ? (
                                                        <motion.div key="data2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-slate-700 leading-none">Kyoto Bullet Train</span>
                                                            <span className="text-[9px] font-medium text-blue-600 leading-none">Reserved • 10:00 AM</span>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div key="skel2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                                                            <div className="h-2 w-full bg-slate-200 rounded-full" />
                                                            <div className="h-2 w-1/2 bg-slate-200 rounded-full" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                
                            </div>
                        </div>
                        
                        <div className="relative z-10 max-w-xl">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-8 shadow-sm">
                                <Sparkles className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-4xl md:text-5xl lg:text-[56px] font-display font-black text-slate-900 mb-6 leading-[1.05] tracking-tight">
                                Sentient <br/>Orchestration.
                            </h3>
                            <p className="text-[17px] text-slate-500 font-medium leading-relaxed max-w-[480px]">
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
                        className="lg:col-span-5 lg:row-span-1 bg-white rounded-[2.5rem] overflow-hidden p-8 border border-slate-200 shadow-xl shadow-slate-200/50 group flex flex-col relative hover:-translate-y-2 hover:shadow-2xl transition-all duration-500"
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
                        className="lg:col-span-5 lg:row-span-1 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-[2.5rem] overflow-hidden p-8 group flex flex-col relative text-white hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(59,130,246,0.4)] transition-all duration-500 shadow-2xl shadow-blue-500/30"
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
