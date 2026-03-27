import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const PIN_LENGTH = 4;
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
export function PinPad({ onSubmit, error, disabled = false }) {
    const [pin, setPin] = useState('');
    const [revealIndex, setRevealIndex] = useState(null);
    const addDigit = useCallback((digit) => {
        if (disabled)
            return;
        setPin((prev) => {
            if (prev.length >= PIN_LENGTH)
                return prev;
            const next = prev + digit;
            setRevealIndex(next.length - 1);
            setTimeout(() => setRevealIndex(null), 300);
            if (next.length === PIN_LENGTH) {
                setTimeout(() => onSubmit(next), 350);
            }
            return next;
        });
    }, [disabled, onSubmit]);
    const deleteDigit = useCallback(() => {
        if (disabled)
            return;
        setPin((prev) => prev.slice(0, -1));
        setRevealIndex(null);
    }, [disabled]);
    const handleKey = (key) => {
        if (key === 'del')
            deleteDigit();
        else if (key !== '')
            addDigit(key);
    };
    return (_jsxs("div", { className: "flex flex-col items-center gap-6", children: [_jsx("div", { className: "flex gap-3", role: "status", "aria-label": `${pin.length} of ${PIN_LENGTH} digits entered`, children: Array.from({ length: PIN_LENGTH }).map((_, i) => (_jsx(motion.div, { className: `w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold
              ${i < pin.length ? 'border-hero-amber bg-slate-700' : 'border-slate-600 bg-slate-800'}`, animate: error ? { x: [0, -8, 8, -8, 8, 0] } : {}, transition: { duration: 0.4 }, children: i < pin.length ? (_jsx("span", { className: "text-hero-amber", children: revealIndex === i ? pin[i] : '●' })) : null }, i))) }), _jsx(AnimatePresence, { children: error && (_jsx(motion.p, { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "text-hero-red font-bold text-base", role: "alert", children: error })) }), _jsx("div", { className: "grid grid-cols-3 gap-3 w-full max-w-[280px]", children: DIGITS.map((key, i) => {
                    if (key === '')
                        return _jsx("div", {}, i);
                    const isDel = key === 'del';
                    return (_jsx("button", { type: "button", onClick: () => handleKey(key), disabled: disabled || (isDel && pin.length === 0), className: `h-16 min-w-[56px] rounded-xl text-xl font-bold transition-all active:scale-90
                ${isDel
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-700 text-white hover:bg-slate-600 active:bg-hero-amber active:text-city-dark'} disabled:opacity-40`, "aria-label": isDel ? 'Delete last digit' : `Digit ${key}`, children: isDel ? '⌫' : key }, key));
                }) })] }));
}
