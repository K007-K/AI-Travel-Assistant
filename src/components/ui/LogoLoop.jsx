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
            const duration = speed ? `${10000 / speed}s` : "40s";
            containerRef.current.style.setProperty("--animation-duration", duration);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`scroller relative z-20 w-full overflow-hidden ${className}`}
        >
            <ul
                ref={scrollerRef}
                className={`flex min-w-full shrink-0 gap-4 py-12 w-max flex-nowrap ${start && "animate-scroll"
                    } ${pauseOnHover && "hover:[animation-play-state:paused]"} ${itemClassName}`}
            >
                {/* Original Items */}
                {items.map((item, idx) => (
                    <li
                        key={`original-${idx}`}
                        className="w-max relative flex-shrink-0"
                    >
                        {item}
                    </li>
                ))}
                {/* Duplicated Items for Loop */}
                {items.map((item, idx) => (
                    <li
                        key={`duplicate-${idx}`}
                        className="w-max relative flex-shrink-0"
                        aria-hidden="true"
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
};
