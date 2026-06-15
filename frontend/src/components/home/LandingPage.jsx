import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, MapPin, Wallet, MessageCircle, Calendar, ArrowRight, Shield, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

import SmoothScroller from '../SmoothScroller';
import InteractiveGlobe from '../canvas/InteractiveGlobe';
import LiquidGlassButton from '../ui/LiquidGlassButton';
import FeatureCard3D from './FeatureCard3D';
import CinematicReveal from '../ui/CinematicReveal';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const destinations = [
        {
            name: 'Araku Valley',
            country: 'India',
            image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1600&h=900&fit=crop',
            description: 'Coffee plantations & tribal culture',
        },
        {
            name: 'Goa',
            country: 'India',
            image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&h=900&fit=crop',
            description: 'Beaches & Portuguese heritage',
        },
        {
            name: 'Jaipur',
            country: 'India',
            image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1600&h=900&fit=crop',
            description: 'Royal palaces & pink city charm',
        },
        {
            name: 'Paris',
            country: 'France',
            image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&h=900&fit=crop',
            description: 'Art, culture & romance',
        },
        {
            name: 'Tokyo',
            country: 'Japan',
            image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&h=900&fit=crop',
            description: 'Tradition meets innovation',
        },
        {
            name: 'Bali',
            country: 'Indonesia',
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&h=900&fit=crop',
            description: 'Tropical paradise & temples',
        },
    ];

    const features = [
        {
            icon: MessageCircle,
            title: "AI Travel Chatbot",
            description: "Get personalized travel recommendations and instant answers from our intelligent AI-powered assistant.",
            color: "text-blue-500",
            bg: "bg-blue-50",
            darkBg: "dark:bg-blue-500/10"
        },
        {
            icon: Calendar,
            title: "Smart Itinerary Builder",
            description: "Create and customize perfect day-by-day travel plans with our intuitive drag-and-drop interface.",
            color: "text-purple-500",
            bg: "bg-purple-50",
            darkBg: "dark:bg-purple-500/10"
        },
        {
            icon: Wallet,
            title: "Smart Budget Tracking",
            description: "Monitor your travel expenses in real-time and get accurate cost estimates to stay on budget.",
            color: "text-green-500",
            bg: "bg-green-50",
            darkBg: "dark:bg-green-500/10"
        },
        {
            icon: MapPin,
            title: "Discover Hidden Gems",
            description: "Explore authentic local attractions and experiences that most tourists miss on their journey.",
            color: "text-orange-500",
            bg: "bg-orange-50",
            darkBg: "dark:bg-orange-500/10"
        },
    ];

    const horizontalScrollRef = useRef(null);
    const containerRef = useRef(null);
    const routeLineRef = useRef(null);

    useEffect(() => {
        // Horizontal Scroll for Destinations
        const sections = gsap.utils.toArray(".destination-card");
        
        if (sections.length > 0 && containerRef.current) {
            let scrollTween = gsap.to(sections, {
                xPercent: -100 * (sections.length - 1),
                ease: "none",
                scrollTrigger: {
                    trigger: containerRef.current,
                    pin: true,
                    scrub: 1,
                    end: "+=3000",
                }
            });
        }

        // SVG Route Line Animation
        if (routeLineRef.current) {
            const length = routeLineRef.current.getTotalLength();
            gsap.set(routeLineRef.current, { strokeDasharray: length, strokeDashoffset: length });
            gsap.to(routeLineRef.current, {
                strokeDashoffset: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: "#features",
                    start: "top center",
                    end: "bottom center",
                    scrub: true,
                }
            });
        }

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    // Staggered text animation
    const headingText = "Travel Without Limits.";
    const headingWords = headingText.split(" ");

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] overflow-x-hidden text-slate-900 dark:text-white selection:bg-blue-500/30">
            <SmoothScroller />
            
            {/* Hero Section */}
            <section className="relative w-full h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                <InteractiveGlobe />
                
                {/* Overlay Gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50 dark:via-[#050505]/50 dark:to-[#050505] pointer-events-none z-0" />

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative z-10 max-w-5xl mx-auto pt-20"
                >
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg text-blue-800 dark:text-blue-300 text-sm font-semibold mb-8 uppercase tracking-wider"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Next-Gen AI Travel Engine</span>
                    </motion.div>

                    <h1 className="text-6xl sm:text-7xl md:text-9xl font-display font-black mb-6 tracking-tighter leading-[1.1] text-slate-900 dark:text-white drop-shadow-2xl flex flex-wrap justify-center gap-4">
                        {headingWords.map((word, index) => (
                            <motion.span
                                key={index}
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1, duration: 0.8, type: "spring" }}
                                className="inline-block"
                            >
                                {word === "Limits." ? (
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                                        {word}
                                    </span>
                                ) : (
                                    word
                                )}
                            </motion.span>
                        ))}
                    </h1>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed drop-shadow-md"
                    >
                        Roameo orchestrates perfect journeys using advanced AI, real-time routing, and smart budget envelopes. The world is yours to explore.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        <LiquidGlassButton onClick={() => isAuthenticated ? navigate('/ai/chat') : navigate('/login')} className="w-full sm:w-auto">
                            Plan Your Journey <ArrowRight className="w-5 h-5 ml-2" />
                        </LiquidGlassButton>
                        <a href="#destinations" className="text-lg font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Discover Places
                        </a>
                    </motion.div>
                </motion.div>
                
                {/* Mock AI Chat Bubble floating near globe */}
                <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute hidden lg:flex top-1/3 right-[10%] bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl items-center gap-3 z-10"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Roameo AI</p>
                        <p className="text-sm font-semibold dark:text-white">Analyzing 43 flights to Tokyo...</p>
                    </div>
                </motion.div>
            </section>

            {/* AI Toolkit Section with Journey Route */}
            <section id="features" className="py-32 relative max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 text-slate-900 dark:text-white">
                        Your Intelligent Travel Companion
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        A full suite of tools designed to make every step of your journey effortless.
                    </p>
                </div>

                <div className="relative">
                    {/* SVG Route Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 hidden lg:block w-1 z-0">
                        <svg width="4" height="100%" className="absolute inset-0">
                            <line ref={routeLineRef} x1="2" y1="0" x2="2" y2="100%" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 relative z-10">
                        {features.map((feature, index) => (
                            <CinematicReveal key={index}>
                                <div className={`flex justify-${index % 2 === 0 ? 'end' : 'start'} lg:transform ${index % 2 === 0 ? 'lg:-translate-x-12' : 'lg:translate-x-12 mt-12 lg:mt-32'}`}>
                                    <div className="w-full lg:w-[450px]">
                                        <FeatureCard3D feature={feature} />
                                    </div>
                                </div>
                            </CinematicReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cinematic Destinations Gallery */}
            <section id="destinations" ref={containerRef} className="h-screen w-full bg-[#030303] flex items-center relative overflow-hidden">
                <div className="absolute top-12 left-12 z-20">
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-xl">
                        Uncover The World
                    </h2>
                    <p className="text-xl text-white/70 mt-2">Scroll to explore curated destinations</p>
                </div>

                <div ref={horizontalScrollRef} className="flex h-screen w-[600vw]">
                    {destinations.map((destination, index) => (
                        <div key={index} className="destination-card w-screen h-full flex items-center justify-center p-8 relative flex-shrink-0 group">
                            {/* Background Image */}
                            <div className="absolute inset-0 overflow-hidden">
                                <img 
                                    src={destination.image} 
                                    alt={destination.name}
                                    className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[2s] ease-out opacity-60"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            </div>

                            <div className="relative z-10 max-w-4xl w-full flex flex-col md:flex-row gap-12 items-end">
                                <div className="flex-1">
                                    <h3 className="text-6xl sm:text-8xl md:text-9xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-4 drop-shadow-2xl">
                                        {destination.name}
                                    </h3>
                                    <p className="text-2xl text-white/90 font-light flex items-center gap-3">
                                        <MapPin className="w-6 h-6 text-blue-400" /> {destination.country}
                                    </p>
                                    <p className="text-lg text-white/70 mt-4 max-w-md">
                                        {destination.description}
                                    </p>
                                </div>
                                <div className="w-full md:w-[400px]">
                                    <div className="glass p-8 rounded-3xl backdrop-blur-2xl bg-black/30 border border-white/10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                                <Sparkles className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/60">AI Insight</p>
                                                <p className="text-white font-medium">Optimal visit: 4-5 days</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => isAuthenticated ? navigate('/ai/chat') : navigate('/login')}
                                            className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-blue-50 transition-colors flex justify-center items-center gap-2"
                                        >
                                            Generate Itinerary <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="relative py-40 overflow-hidden bg-slate-900 dark:bg-black">
                {/* Dynamic radar/orbit background */}
                <div className="absolute inset-0 z-0 opacity-30 flex items-center justify-center">
                    <div className="w-[800px] h-[800px] rounded-full border border-blue-500/20 animate-[spin_60s_linear_infinite]" />
                    <div className="w-[600px] h-[600px] absolute rounded-full border border-blue-500/30 animate-[spin_40s_linear_infinite_reverse]" />
                    <div className="w-[400px] h-[400px] absolute rounded-full border border-purple-500/40 animate-[spin_20s_linear_infinite]" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-0" />

                <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-8">
                            Your Journey <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Begins Here</span>
                        </h2>
                        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light">
                            Stop spending weeks planning. Let Roameo's AI build your perfect, budget-optimized itinerary in seconds.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <LiquidGlassButton onClick={() => isAuthenticated ? navigate('/ai/chat') : navigate('/signup')} className="w-full sm:w-auto text-lg px-12 py-5">
                                Board Flight to Future
                            </LiquidGlassButton>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
