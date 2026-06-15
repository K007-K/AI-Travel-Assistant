import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const LiquidGlassButton = ({ children, onClick, className = '' }) => {
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.button
            ref={buttonRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative overflow-hidden rounded-full px-8 py-4 font-bold text-white shadow-2xl backdrop-blur-2xl border border-white/20 bg-white/10 ${className}`}
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
            }}
        >
            <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.4), transparent 40%)`
                }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-md">
                {children}
            </span>
            <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none" />
        </motion.button>
    );
};

export default LiquidGlassButton;
