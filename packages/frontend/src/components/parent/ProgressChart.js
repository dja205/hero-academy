import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DEFAULT_COLORS = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-purple-500',
];
export function ProgressChart({ data, title }) {
    if (data.length === 0) {
        return _jsx("p", { className: "text-gray-500 text-sm", children: "No data yet" });
    }
    return (_jsxs("div", { children: [title && _jsx("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: title }), _jsx("div", { className: "space-y-3", children: data.map((item, i) => {
                    const pct = item.maxValue > 0 ? Math.round((item.value / item.maxValue) * 100) : 0;
                    const barColor = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { className: "text-gray-700 font-medium", children: item.label }), _jsxs("span", { className: "text-gray-500", children: [pct, "%"] })] }), _jsx("div", { className: "w-full bg-gray-100 rounded-full h-3", children: _jsx("div", { className: `h-3 rounded-full transition-all duration-500 ${barColor}`, style: { width: `${pct}%` } }) })] }, item.label));
                }) })] }));
}
