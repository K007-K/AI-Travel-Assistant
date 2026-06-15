import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { MeshDistortMaterial, Environment, Float, ContactShadows } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Sparkles } from 'lucide-react';

const FluidGlassShape = () => {
    return (
        <>
            <ambientLight intensity={1.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
            
            {/* Colorful lights hidden behind the shape to create gorgeous internal refractions */}
            <pointLight position={[-5, -5, -5]} color="#3b82f6" intensity={50} distance={20} />
            <pointLight position={[5, -5, -5]} color="#ec4899" intensity={50} distance={20} />
            <pointLight position={[0, 5, -5]} color="#8b5cf6" intensity={50} distance={20} />
            <pointLight position={[0, 0, 0]} color="#ffffff" intensity={20} distance={10} />
            
            <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
                <mesh position={[3, 0, -4]} scale={1.8}>
                    <sphereGeometry args={[2, 128, 128]} />
                    <MeshDistortMaterial 
                        color="#ffffff"
                        transmission={1}
                        roughness={0.1}
                        thickness={2.5}
                        ior={1.4}
                        chromaticAberration={0.04}
                        distort={0.4} 
                        speed={1.5} 
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                    />
                </mesh>
            </Float>

            {/* A secondary smaller floating glass element for depth */}
            <Float speed={3} rotationIntensity={2} floatIntensity={2}>
                <mesh position={[-4, 2, -2]} scale={0.8}>
                    <sphereGeometry args={[1.5, 64, 64]} />
                    <MeshDistortMaterial 
                        color="#ffffff"
                        transmission={1}
                        roughness={0.2}
                        thickness={1.5}
                        ior={1.5}
                        distort={0.3} 
                        speed={2} 
                    />
                </mesh>
            </Float>

            {/* Soft shadows on the "floor" to ground the 3D objects */}
            <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
            
            {/* High-quality lighting reflections */}
            <Environment preset="studio" />
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
            className="w-full max-w-4xl mx-auto mt-12 bg-white/70 backdrop-blur-2xl rounded-full p-2.5 border border-white/80 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] flex flex-col md:flex-row items-center gap-2 relative z-20"
        >
            {fields.map((field, index) => {
                const Icon = field.icon;
                const isFocused = focusedField === field.id;
                
                return (
                    <React.Fragment key={field.id}>
                        <motion.div 
                            className={`flex-1 flex items-center gap-3 px-6 py-3.5 rounded-full cursor-pointer transition-colors duration-300 ${isFocused ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'hover:bg-white/50'}`}
                            onClick={() => setFocusedField(field.id)}
                            layout
                        >
                            <Icon className={`w-5 h-5 ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div className="flex flex-col text-left w-full">
                                <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase mb-0.5">{field.label}</span>
                                <input 
                                    type="text" 
                                    placeholder={field.placeholder}
                                    className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 w-full focus:ring-0 p-0"
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="w-full md:w-auto h-14 px-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 transition-all"
            >
                <Search className="w-5 h-5 text-blue-400" />
                <span className="md:hidden">Search</span>
            </motion.button>
        </motion.div>
    );
};

const HeroSection = () => {
    return (
        <section className="relative w-full h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-[#fafafa]">
            
            {/* Jaw-Dropping WebGL Background */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                    <FluidGlassShape />
                </Canvas>
            </div>

            {/* Soft gradient to blend the 3D scene edges and ensure text readability at the bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#fafafa]/40 via-transparent to-[#fafafa] z-10 pointer-events-none" />

            {/* Content Overlay */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 text-center pt-20 pointer-events-none">
                
                <motion.div
                    className="pointer-events-auto"
                    initial={{ scale: 0.95, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md text-slate-800 font-semibold text-sm mb-8 border border-white shadow-sm ring-1 ring-slate-900/5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        The Future of Travel in 2026
                    </span>
                    
                    <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-display font-black tracking-tighter text-slate-900 leading-[0.95] drop-shadow-sm">
                        Explore with <br className="hidden md:block" />
                        <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            absolute clarity.
                        </span>
                    </h1>
                    
                    <p className="mt-8 text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        Experience jaw-dropping destinations curated by sentient AI. Flawless itineraries, spatial booking, and total financial clarity.
                    </p>
                </motion.div>

                <div className="pointer-events-auto">
                    <SearchPill />
                </div>

            </div>
        </section>
    );
};

export default HeroSection;
