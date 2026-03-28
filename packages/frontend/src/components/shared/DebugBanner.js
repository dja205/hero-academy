import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
/**
 * DebugBanner — shown when the server is running with DEBUG_UNLOCK_ALL=true.
 * Detects the X-Debug-Unlock-All response header from the health endpoint.
 * Never shown in production (server only sets the header when debug mode is on).
 */
export function DebugBanner() {
    const [debugMode, setDebugMode] = useState(false);
    useEffect(() => {
        fetch('/api/v1/health', { credentials: 'include' })
            .then((res) => {
            if (res.headers.get('x-debug-unlock-all') === 'true') {
                setDebugMode(true);
            }
        })
            .catch(() => { });
    }, []);
    if (!debugMode)
        return null;
    return (_jsx("div", { role: "alert", className: "fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1 px-2", style: { fontFamily: 'monospace' }, children: "\uD83D\uDC1B DEBUG MODE \u2014 All content unlocked (DEBUG_UNLOCK_ALL=true) \u2014 NOT for production" }));
}
