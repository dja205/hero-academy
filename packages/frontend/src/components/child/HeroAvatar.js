import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const COSTUME_COLOURS = {
    1: { body: '#ef4444', accent: '#fbbf24' },
    2: { body: '#3b82f6', accent: '#60a5fa' },
    3: { body: '#8b5cf6', accent: '#c084fc' },
};
const MASK_PATHS = {
    1: 'M20 18 C20 14, 25 12, 30 12 C35 12, 40 14, 40 18 L38 20 L22 20 Z',
    2: 'M18 17 C18 13, 24 10, 30 10 C36 10, 42 13, 42 17 L40 22 L20 22 Z',
};
export function HeroAvatar({ costume, mask, size = 80, className = '', animate = false }) {
    const colours = COSTUME_COLOURS[costume] ?? COSTUME_COLOURS[1];
    const maskPath = MASK_PATHS[mask] ?? MASK_PATHS[1];
    const Wrapper = animate ? motion.div : 'div';
    const wrapperProps = animate
        ? { animate: { y: [0, -6, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
        : {};
    return (_jsx(Wrapper, { className: `inline-flex items-center justify-center ${className}`, ...wrapperProps, children: _jsxs("svg", { width: size, height: size, viewBox: "0 0 60 60", fill: "none", xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-label": "Hero avatar", children: [_jsx("path", { d: "M18 30 L10 55 L30 48 L50 55 L42 30 Z", fill: colours.accent, opacity: 0.7 }), _jsx("rect", { x: "20", y: "28", width: "20", height: "22", rx: "4", fill: colours.body }), _jsx("rect", { x: "20", y: "38", width: "20", height: "4", rx: "1", fill: colours.accent }), _jsx("rect", { x: "27", y: "37", width: "6", height: "6", rx: "1", fill: "#fbbf24", stroke: "#f59e0b", strokeWidth: "0.5" }), _jsx("circle", { cx: "30", cy: "20", r: "12", fill: "#fcd34d" }), _jsx("path", { d: maskPath, fill: colours.body }), _jsx("circle", { cx: "26", cy: "17", r: "2", fill: "white" }), _jsx("circle", { cx: "34", cy: "17", r: "2", fill: "white" }), _jsx("circle", { cx: "26.5", cy: "17.5", r: "1", fill: colours.body === '#3b82f6' ? '#1e3a5f' : '#1a1a2e' }), _jsx("circle", { cx: "34.5", cy: "17.5", r: "1", fill: colours.body === '#3b82f6' ? '#1e3a5f' : '#1a1a2e' }), _jsx("path", { d: "M26 23 Q30 27 34 23", stroke: "#92400e", strokeWidth: "1.2", fill: "none", strokeLinecap: "round" }), _jsx("polygon", { points: "30,30 31.2,33 34.5,33 32,35 33,38 30,36 27,38 28,35 25.5,33 28.8,33", fill: colours.accent })] }) }));
}
