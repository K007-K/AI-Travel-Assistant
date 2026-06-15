import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const FeatureCard3D = ({ feature }) => {
    const cardRef = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative w-full h-[320px] rounded-3xl bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-xl cursor-pointer"
        >
            <div
                style={{
                    transform: "translateZ(50px)",
                    transformStyle: "preserve-3d",
                }}
                className="absolute inset-0 p-8 flex flex-col justify-between"
            >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.darkBg} ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <feature.icon className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-slate-900 dark:text-white drop-shadow-sm">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                        {feature.description}
                    </p>
                </div>
                
                {/* Decorative boarding pass element */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-50 dark:bg-[#0a0a0a] rounded-l-full border-l border-t border-b border-slate-200 dark:border-white/10" />
            </div>
            
            {/* Inner Glass border */}
            <div className="absolute inset-0 rounded-3xl border border-white/20 dark:border-white/5 pointer-events-none" />
        </motion.div>
    );
};

export default FeatureCard3D;
