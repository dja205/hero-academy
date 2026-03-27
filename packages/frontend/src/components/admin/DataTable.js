import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useState } from 'react';
export function DataTable({ columns, data, keyField, page = 1, totalPages = 1, onPageChange, onRowClick, expandRow, emptyMessage = 'No data found', }) {
    const [expandedId, setExpandedId] = useState(null);
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        }
        else {
            setSortKey(key);
            setSortDir('asc');
        }
    };
    let sortedData = [...data];
    if (sortKey) {
        sortedData.sort((a, b) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }
    return (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-gray-50 border-b border-gray-200", children: columns.map((col) => (_jsxs("th", { className: `px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''} ${col.className || ''}`, onClick: () => col.sortable && handleSort(col.key), children: [col.header, col.sortable && sortKey === col.key && (_jsx("span", { className: "ml-1", children: sortDir === 'asc' ? '↑' : '↓' }))] }, col.key))) }) }), _jsx("tbody", { className: "divide-y divide-gray-100", children: sortedData.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "px-4 py-8 text-center text-gray-500", children: emptyMessage }) })) : (sortedData.map((item) => {
                                const id = String(item[keyField]);
                                const isExpanded = expandedId === id;
                                return (_jsxs(Fragment, { children: [_jsx("tr", { className: `hover:bg-gray-50 transition-colors ${onRowClick || expandRow ? 'cursor-pointer' : ''}`, onClick: () => {
                                                if (expandRow)
                                                    setExpandedId(isExpanded ? null : id);
                                                else if (onRowClick)
                                                    onRowClick(item);
                                            }, children: columns.map((col) => (_jsx("td", { className: `px-4 py-3 text-gray-900 ${col.className || ''}`, children: col.render
                                                    ? col.render(item)
                                                    : String(item[col.key] ?? '') }, col.key))) }), expandRow && isExpanded && (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "px-4 py-3 bg-gray-50", children: expandRow(item) }) }))] }, id));
                            })) })] }) }), totalPages > 1 && onPageChange && (_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-gray-200", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => onPageChange(page - 1), disabled: page <= 1, className: "px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700", children: "Previous" }), _jsx("button", { onClick: () => onPageChange(page + 1), disabled: page >= totalPages, className: "px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700", children: "Next" })] })] }))] }));
}
