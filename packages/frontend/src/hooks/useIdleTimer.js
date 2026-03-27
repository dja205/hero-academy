import { useEffect, useRef, useCallback } from 'react';
const IDLE_EVENTS = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
];
/**
 * Auto-logout hook. Calls `onIdle` after `timeoutMs` of inactivity.
 * Resets on any user interaction event.
 */
export function useIdleTimer(onIdle, timeoutMs = 2 * 60 * 60 * 1000) {
    const timerRef = useRef(null);
    const onIdleRef = useRef(onIdle);
    onIdleRef.current = onIdle;
    const resetTimer = useCallback(() => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onIdleRef.current(), timeoutMs);
    }, [timeoutMs]);
    useEffect(() => {
        resetTimer();
        const handler = () => resetTimer();
        for (const event of IDLE_EVENTS) {
            window.addEventListener(event, handler, { passive: true });
        }
        return () => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
            for (const event of IDLE_EVENTS) {
                window.removeEventListener(event, handler);
            }
        };
    }, [resetTimer]);
}
