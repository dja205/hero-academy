import { jsx as _jsx } from "react/jsx-runtime";
import { motion, useReducedMotion } from 'framer-motion';
export function StarReveal({ stars, initialDelay = 400 }) {
    const prefersReduced = useReducedMotion();
    return (_jsx("div", { className: "flex gap-3 justify-center", "aria-label": `${stars} out of 3 stars earned`, children: [1, 2, 3].map((n) => {
            const earned = n <= stars;
            const delayMs = initialDelay + (n - 1) * 200;
            return (_jsx(motion.div, { initial: prefersReduced ? { opacity: earned ? 1 : 0.3 } : { scale: 0, opacity: 0, rotate: -180 }, animate: prefersReduced
                    ? { opacity: earned ? 1 : 0.3 }
                    : { scale: earned ? 1 : 0.7, opacity: earned ? 1 : 0.3, rotate: 0 }, transition: prefersReduced
                    ? { duration: 0 }
                    : { delay: delayMs / 1000, type: 'spring', stiffness: 200, damping: 12 }, className: "text-5xl", role: "img", "aria-label": earned ? 'Star earned' : 'Star not earned', children: _jsx("span", { className: earned ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'grayscale', children: "\u2B50" }) }, n));
        }) }));
}
