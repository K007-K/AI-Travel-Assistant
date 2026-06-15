import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const CinematicReveal = ({ children }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["0 1", "0.8 1"]
    });

    const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
    const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const filter = useTransform(scrollYProgress, [0, 1], ["blur(15px)", "blur(0px)"]);

    return (
        <motion.div
            ref={ref}
            style={{
                scale,
                opacity,
                filter
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

export default CinematicReveal;
