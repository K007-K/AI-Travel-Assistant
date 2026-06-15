import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SmoothScroller from '../SmoothScroller';
import { ArrowRight, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    
    // Mouse tracker for custom cursor & spotlight
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    
    const heroRef = useRef(null);
    const deviceSequenceRef = useRef(null);
    const deviceFrameRef = useRef(null);
    const screen1Ref = useRef(null);
    const screen2Ref = useRef(null);
    const screen3Ref = useRef(null);
    const text1Ref = useRef(null);
    const text2Ref = useRef(null);
    const text3Ref = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        // Device Sequence GSAP
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: deviceSequenceRef.current,
                start: "top top",
                end: "+=3000",
                scrub: 1,
                pin: true,
            }
        });

        // Initial state
        gsap.set([screen2Ref.current, screen3Ref.current], { opacity: 0, scale: 1.1 });
        gsap.set([text2Ref.current, text3Ref.current], { opacity: 0, y: 50 });

        // Transition to Screen 2
        tl.to(screen1Ref.current, { opacity: 0, scale: 0.9, duration: 1 })
          .to(text1Ref.current, { opacity: 0, y: -50, duration: 1 }, "<")
          .to(screen2Ref.current, { opacity: 1, scale: 1, duration: 1 }, "<")
          .to(text2Ref.current, { opacity: 1, y: 0, duration: 1 }, "<")
          
        // Transition to Screen 3
          .to(screen2Ref.current, { opacity: 0, scale: 0.9, duration: 1 }, "+=1")
          .to(text2Ref.current, { opacity: 0, y: -50, duration: 1 }, "<")
          .to(screen3Ref.current, { opacity: 1, scale: 1, duration: 1 }, "<")
          .to(text3Ref.current, { opacity: 1, y: 0, duration: 1 }, "<")
          
          .to({}, { duration: 1 }); // buffer at end

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    const destinations = [
        { name: 'Kyoto', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2000&auto=format&fit=crop' },
        { name: 'Swiss Alps', image: 'https://images.unsplash.com/photo-1531366936010-27c57cb26ce2?q=80&w=2000&auto=format&fit=crop' },
        { name: 'Santorini', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=2000&auto=format&fit=crop' },
        { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2000&auto=format&fit=crop' }
    ];

    return (
        <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-blue-500/30 overflow-hidden">
            <SmoothScroller />

            {/* Custom Spotlight Cursor */}
            <motion.div 
                className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none z-50 mix-blend-screen"
                style={{
                    background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)',
                    x: mousePos.x - 300,
                    y: mousePos.y - 300,
                }}
            />

            {/* Phase 1: Cinematic Video Mask Hero */}
            <section ref={heroRef} className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
                {/* Background Video */}
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-flying-over-a-snowy-mountain-peak-1249-large.mp4" type="video/mp4" />
                </video>

                {/* Masking Layer - Mix blend multiply creates the video-inside-text effect */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black mix-blend-multiply pointer-events-none">
                    <h1 className="text-[12vw] sm:text-[10vw] font-black tracking-tighter leading-none text-center text-white p-4 uppercase mix-blend-normal">
                        TRAVEL<br/>WITHOUT<br/>LIMITS
                    </h1>
                </div>

                {/* Overlay Text */}
                <div className="absolute bottom-12 flex flex-col items-center justify-center z-20 pointer-events-none">
                    <p className="text-white/60 tracking-widest text-sm uppercase mb-4 font-mono">Scroll to discover</p>
                    <div className="w-[1px] h-16 bg-gradient-to-b from-white/60 to-transparent" />
                </div>
            </section>

            {/* Phase 2: Device Sticky-Scroll Sequence */}
            <section ref={deviceSequenceRef} className="relative h-screen w-full bg-[#050505] flex items-center justify-center overflow-hidden border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 w-full h-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 relative z-10">
                    
                    {/* Typography Side */}
                    <div className="w-full lg:w-1/2 relative h-[200px] lg:h-[400px] flex items-center">
                        <div ref={text1Ref} className="absolute inset-0 flex flex-col justify-center">
                            <span className="text-blue-500 font-mono text-sm tracking-widest uppercase mb-4">01 // Artificial Intelligence</span>
                            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">Talk to<br/>your journey.</h2>
                            <p className="text-xl text-white/50 font-light max-w-md leading-relaxed">Our sentient AI companion crafts, refines, and adapts your itinerary in real-time through natural conversation.</p>
                        </div>
                        <div ref={text2Ref} className="absolute inset-0 flex flex-col justify-center">
                            <span className="text-purple-500 font-mono text-sm tracking-widest uppercase mb-4">02 // Absolute Precision</span>
                            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">Pixel-perfect<br/>planning.</h2>
                            <p className="text-xl text-white/50 font-light max-w-md leading-relaxed">Drag, drop, and conquer your schedule. Real driving times and layout automation do the heavy lifting.</p>
                        </div>
                        <div ref={text3Ref} className="absolute inset-0 flex flex-col justify-center">
                            <span className="text-green-500 font-mono text-sm tracking-widest uppercase mb-4">03 // Financial Clarity</span>
                            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">Smart<br/>envelopes.</h2>
                            <p className="text-xl text-white/50 font-light max-w-md leading-relaxed">Monitor group expenses globally with our dynamic currency-aware budget tracking engine.</p>
                        </div>
                    </div>

                    {/* Device Side */}
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end perspective-[2000px]">
                        <div 
                            ref={deviceFrameRef}
                            className="relative w-[300px] h-[600px] lg:w-[350px] lg:h-[700px] rounded-[3rem] bg-black border-[8px] border-[#1a1a1a] shadow-[0_0_100px_rgba(255,255,255,0.05)] overflow-hidden"
                            style={{ transform: "rotateY(-15deg) rotateX(5deg)" }}
                        >
                            {/* Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-20 pointer-events-none" />
                            
                            {/* Screen 1: Chatbot Mockup */}
                            <div ref={screen1Ref} className="absolute inset-0 bg-[#0a0a0a] p-6 flex flex-col gap-4 pt-12">
                                <div className="w-full h-32 rounded-2xl bg-white/5 animate-pulse" />
                                <div className="w-3/4 h-16 rounded-2xl bg-blue-500/20 ml-auto" />
                                <div className="w-5/6 h-24 rounded-2xl bg-white/5" />
                                <div className="mt-auto w-full h-12 rounded-full bg-white/10" />
                            </div>

                            {/* Screen 2: Itinerary Mockup */}
                            <div ref={screen2Ref} className="absolute inset-0 bg-[#0a0a0a] p-6 flex flex-col gap-3 pt-12">
                                <div className="w-full h-20 rounded-xl bg-purple-500/20" />
                                <div className="w-full h-16 rounded-xl bg-white/5" />
                                <div className="w-full h-16 rounded-xl bg-white/5" />
                                <div className="w-full h-32 rounded-xl border border-dashed border-white/20 mt-4" />
                            </div>

                            {/* Screen 3: Budget Mockup */}
                            <div ref={screen3Ref} className="absolute inset-0 bg-[#0a0a0a] p-6 flex flex-col gap-4 pt-12">
                                <div className="w-32 h-32 rounded-full border-8 border-green-500/30 mx-auto" />
                                <div className="flex justify-between mt-8">
                                    <div className="w-20 h-20 rounded-xl bg-white/5" />
                                    <div className="w-20 h-20 rounded-xl bg-white/5" />
                                    <div className="w-20 h-20 rounded-xl bg-white/5" />
                                </div>
                                <div className="w-full h-12 rounded-xl bg-green-500/20 mt-auto" />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Phase 3: Liquid Grid Gallery */}
            <section className="py-32 bg-[#050505] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 mb-20 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Curated Escapes</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 h-[70vh]">
                    {destinations.map((dest, i) => (
                        <div key={i} className="group relative w-full h-full overflow-hidden rounded-2xl cursor-crosshair">
                            <img 
                                src={dest.image} 
                                className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-500" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <h3 className="text-4xl font-light tracking-widest text-white/40 group-hover:text-white transition-colors duration-500 mix-blend-overlay group-hover:mix-blend-normal drop-shadow-2xl uppercase">
                                    {dest.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Phase 4: Orbital CTA */}
            <section className="relative h-screen w-full bg-black flex items-center justify-center overflow-hidden">
                {/* Massive Glowing Orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
                    <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-[100px] mix-blend-screen animate-pulse" />
                    <div className="absolute inset-10 rounded-full bg-purple-600/10 blur-[80px] mix-blend-screen animate-[pulse_4s_ease-in-out_infinite]" />
                    <div className="absolute inset-20 rounded-full bg-cyan-400/5 blur-[60px] mix-blend-screen animate-[pulse_3s_ease-in-out_infinite]" />
                </div>

                <div className="relative z-10 text-center flex flex-col items-center">
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 drop-shadow-2xl">
                        INITIALIZE<br/>JOURNEY
                    </h2>
                    
                    <button 
                        onClick={() => isAuthenticated ? navigate('/ai/chat') : navigate('/signup')}
                        className="group relative px-12 py-5 rounded-full bg-[#0a0a0a] border border-white/10 hover:border-transparent overflow-hidden transition-colors duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]"
                    >
                        {/* Neon border trace effect - simplified using standard CSS */}
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 p-[1px] -z-10">
                            <div className="absolute inset-0 bg-[#0a0a0a] rounded-full" />
                        </div>
                        
                        <span className="relative z-10 text-lg font-light tracking-[0.2em] uppercase flex items-center gap-4 group-hover:text-blue-400 transition-colors">
                            Enter Platform <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </span>
                    </button>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
