import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { MeshDistortMaterial, Environment, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Users, ArrowRight, Sparkles } from 'lucide-react';

const FluidShapes = () => {
    return (
        <>
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
            <directionalLight position={[-10, -10, -5]} intensity={1} color="#bfdbfe" />
            
            {/* Main large fluid shape - pure white/glassy */}
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[4, 1, -5]} scale={14}>
                    <sphereGeometry args={[1, 128, 128]} />
                    <MeshDistortMaterial 
                        color="#ffffff" 
                        envMapIntensity={1.5} 
                        clearcoat={1} 
                        clearcoatRoughness={0.1} 
                        metalness={0.1} 
                        roughness={0.3} 
                        distort={0.3} 
                        speed={1.2} 
                    />
                </mesh>
            </Float>

            {/* Secondary shape - soft blue */}
            <Float speed={2} rotationIntensity={0.8} floatIntensity={2}>
                <mesh position={[-5, -2, -8]} scale={10}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshDistortMaterial 
                        color="#e0f2fe" 
                        envMapIntensity={1} 
                        clearcoat={1} 
                        clearcoatRoughness={0.2} 
                        distort={0.4} 
                        speed={1.5} 
                    />
                </mesh>
            </Float>
            
            {/* Third shape - soft coral/accent */}
            <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.5}>
                <mesh position={[-2, 6, -10]} scale={8}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshDistortMaterial 
                        color="#fff1f2" 
                        envMapIntensity={1} 
                        clearcoat={1} 
                        distort={0.5} 
                        speed={2} 
                    />
                </mesh>
            </Float>

            <Environment preset="city" />
        </>
    );
};

const SearchPill = () => {
    const [focusedField, setFocusedField] = useState(null);

    const fields = [
        { id: 'where', icon: MapPin, label: 'Where to?', placeholder: 'Search destinations' },
        { id: 'when', icon: Calendar, label: 'When?', placeholder: 'Add dates' },
        { id: 'who', icon: Users, label: 'Who?', placeholder: 'Add guests' }
    ];

    return (
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 100 }}
            className="w-full max-w-4xl mx-auto mt-12 bg-white/70 backdrop-blur-3xl rounded-full p-2 border border-white/80 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col md:flex-row items-center gap-2 relative z-20"
        >
            {fields.map((field, index) => {
                const Icon = field.icon;
                const isFocused = focusedField === field.id;
                
                return (
                    <React.Fragment key={field.id}>
                        <motion.div 
                            className={`flex-1 flex items-center gap-3 px-6 py-3 rounded-full cursor-pointer transition-colors duration-300 ${isFocused ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                            onClick={() => setFocusedField(field.id)}
                            layout
                        >
                            <Icon className={`w-5 h-5 ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-800">{field.label}</span>
                                <input 
                                    type="text" 
                                    placeholder={field.placeholder}
                                    className="bg-transparent border-none outline-none text-sm text-slate-600 placeholder:text-slate-400 w-full focus:ring-0 p-0"
                                    onFocus={() => setFocusedField(field.id)}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </motion.div>
                        {index < fields.length - 1 && (
                            <div className="w-px h-10 bg-slate-200 hidden md:block" />
                        )}
                    </React.Fragment>
                );
            })}
            
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full md:w-auto h-14 px-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
                <Search className="w-5 h-5" />
                <span className="md:hidden">Search</span>
            </motion.button>
        </motion.div>
    );
};

const HeroSection = () => {
    return (
        <section className="relative w-full h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-[#fafafa]">
            
            {/* WebGL Background */}
            <div className="absolute inset-0 z-0 opacity-80">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <FluidShapes />
                </Canvas>
            </div>

            {/* Gradient Overlays to ensure text readability & soft edges */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#fafafa]/50 via-transparent to-[#fafafa] z-10 pointer-events-none" />

            {/* Content Overlay */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center pt-20">
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm mb-6 border border-blue-100 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                        The Future of Travel in 2026
                    </span>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter text-slate-900 leading-[1.1]">
                        Explore the world <br className="hidden md:block" />
                        <span className="relative">
                            with absolute clarity.
                            <motion.div 
                                className="absolute -bottom-2 md:-bottom-4 left-0 right-0 h-3 md:h-6 bg-blue-200/50 -z-10 rounded-full"
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{ delay: 0.8, duration: 1, ease: "circOut" }}
                                style={{ transformOrigin: "left" }}
                            />
                        </span>
                    </h1>
                    
                    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        Experience jaw-dropping destinations curated by sentient AI. Flawless itineraries, spatial booking, and total financial clarity.
                    </p>
                </motion.div>

                <SearchPill />

            </div>
        </section>
    );
};

export default HeroSection;
