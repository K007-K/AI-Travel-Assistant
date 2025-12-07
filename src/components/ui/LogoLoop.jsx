import { useRef, useState, useEffect } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";

export const LogoLoop = ({
    items = [],
    direction = "left",
    speed = 50,
    pauseOnHover = true,
    className = "",
    itemClassName = "",
}) => {
    const containerRef = useRef(null);
    const scrollerRef = useRef(null);
    const [start, setStart] = useState(false);

    useEffect(() => {
        if (!containerRef.current || !scrollerRef.current) return;

        // Clean up previous clones if re-running
        const scrollerContent = Array.from(scrollerRef.current.children);
        // Only potential issue with strict mode is double duplication,
        // but let's check if we already duplicated.
        // A simple heuristic: if child count > initial items length.

        if (scrollerRef.current.children.length === items.length) {
            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                duplicatedItem.setAttribute('aria-hidden', 'true'); // Accessibility
                scrollerRef.current.appendChild(duplicatedItem);
            });
        }

        getDirection();
        getSpeed();
        setStart(true);
    }, [items, direction, speed]);

    const getDirection = () => {
        if (containerRef.current) {
            if (direction === "left") {
                containerRef.current.style.setProperty("--animation-direction", "normal");
            } else {
                containerRef.current.style.setProperty("--animation-direction", "reverse");
            }
        }
    };

    const getSpeed = () => {
        if (containerRef.current) {
            // Calculate duration based on speed (pixels per second) is tricky with CSS only
            // simpler to stick to duration classes or style
            // For now, let's use a standard duration and adjust logic if needed,
            // or set raw duration style
            const duration = speed ? `${10000 / speed}s` : "20s"; // Rough mapping
            containerRef.current.style.setProperty("--animation-duration", "40s");
        }
    };


    // Combined into main effect for better sync and dependency management


    return (
        <div
            ref={containerRef}
            className={`scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] ${className}`}
        >
            <ul
                ref={scrollerRef}
                className={`flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap ${start && "animate-scroll"
                    } ${pauseOnHover && "hover:[animation-play-state:paused]"} ${itemClassName}`}
            >
                {items.map((item, idx) => (
                    <li
                        key={idx}
                        className="w-[350px] max-w-full relative flex-shrink-0 px-8 py-6 md:w-[450px]"
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
};
