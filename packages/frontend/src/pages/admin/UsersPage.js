import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { apiClient } from '../../api/client';
import { DataTable } from '../../components/admin/DataTable';
export function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [childrenMap, setChildrenMap] = useState({});
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getUsers({ page, limit: 20 });
            let filtered = data.users;
            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter((u) => u.email?.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
            }
            setUsers(filtered);
            setTotalPages(Math.max(1, Math.ceil(data.total / data.limit)));
        }
        catch {
            /* handled */
        }
        finally {
            setLoading(false);
        }
    }, [page, search]);
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);
    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };
    const loadChildren = async (userId) => {
        if (childrenMap[userId])
            return;
        try {
            const data = await apiClient.get(`/admin/users/${encodeURIComponent(userId)}/children`);
            setChildrenMap((m) => ({ ...m, [userId]: data.children }));
        }
        catch {
            setChildrenMap((m) => ({ ...m, [userId]: [] }));
        }
    };
    const handleSuspend = async (userId, suspend) => {
        try {
            await apiClient.put(`/admin/users/${encodeURIComponent(userId)}/status`, {
                status: suspend ? 'suspended' : 'active',
            });
            await loadUsers();
        }
        catch {
            /* handled */
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Users" }), _jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [_jsx("input", { type: "text", value: searchInput, onChange: (e) => setSearchInput(e.target.value), placeholder: "Search by email...", className: "px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 w-64" }), _jsx("button", { type: "submit", className: "px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: "Search" })] })] }), loading ? (_jsx("p", { className: "text-gray-500 py-8 text-center", children: "Loading..." })) : (_jsx(DataTable, { columns: [
                    { key: 'email', header: 'Email', sortable: true },
                    { key: 'name', header: 'Name', sortable: true },
                    {
                        key: 'plan',
                        header: 'Plan',
                        render: (u) => (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700", children: String(u.plan || 'Free') })),
                    },
                    {
                        key: 'status',
                        header: 'Status',
                        render: (u) => {
                            const suspended = String(u.status) === 'suspended';
                            return suspended ? (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-red-100 text-red-700", children: "Suspended" })) : (_jsx("span", { className: "text-xs px-2 py-0.5 rounded bg-green-100 text-green-700", children: "Active" }));
                        },
                    },
                    {
                        key: 'createdAt',
                        header: 'Created',
                        sortable: true,
                        render: (u) => new Date(String(u.createdAt)).toLocaleDateString(),
                    },
                    {
                        key: 'actions',
                        header: '',
                        render: (u) => {
                            const suspended = String(u.status) === 'suspended';
                            return (_jsx("div", { onClick: (e) => e.stopPropagation(), children: _jsx("button", { onClick: () => handleSuspend(String(u.id), !suspended), className: `text-xs font-medium ${suspended
                                        ? 'text-green-600 hover:text-green-800'
                                        : 'text-red-600 hover:text-red-800'}`, children: suspended ? 'Unsuspend' : 'Suspend' }) }));
                        },
                    },
                ], data: users, keyField: "id", page: page, totalPages: totalPages, onPageChange: setPage, expandRow: (u) => {
                    const userId = String(u.id);
                    const kids = childrenMap[userId];
                    if (!kids) {
                        loadChildren(userId);
                        return _jsx("p", { className: "text-sm text-gray-500", children: "Loading children..." });
                    }
                    if (kids.length === 0) {
                        return _jsx("p", { className: "text-sm text-gray-500", children: "No children registered." });
                    }
                    return (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase", children: "Children" }), kids.map((c) => (_jsxs("div", { className: "flex items-center gap-4 text-sm", children: [_jsx("span", { className: "font-medium text-gray-900", children: c.heroName }), _jsxs("span", { className: "text-gray-500", children: [c.xp, " XP"] }), _jsx("span", { className: "text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700", children: c.rank }), c.lastActiveAt && (_jsxs("span", { className: "text-gray-400 text-xs", children: ["Last active: ", new Date(c.lastActiveAt).toLocaleDateString()] }))] }, c.id)))] }));
                }, emptyMessage: "No users found" }))] }));
}
