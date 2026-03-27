import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { apiClient } from '../../api/client';
import { DataTable } from '../../components/admin/DataTable';

interface UserItem {
  id: string;
  email?: string;
  name: string;
  role: string;
  plan?: string;
  status?: string;
  createdAt: string;
}

interface UserChild {
  id: string;
  heroName: string;
  xp: number;
  rank: string;
  lastActiveAt?: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [childrenMap, setChildrenMap] = useState<Record<string, UserChild[]>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({ page, limit: 20 });
      let filtered = data.users;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.email?.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
        );
      }
      setUsers(filtered);
      setTotalPages(Math.max(1, Math.ceil(data.total / data.limit)));
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const loadChildren = async (userId: string) => {
    if (childrenMap[userId]) return;
    try {
      const data = await apiClient.get<{ children: UserChild[] }>(
        `/admin/users/${encodeURIComponent(userId)}/children`,
      );
      setChildrenMap((m) => ({ ...m, [userId]: data.children }));
    } catch {
      setChildrenMap((m) => ({ ...m, [userId]: [] }));
    }
  };

  const handleSuspend = async (userId: string, suspend: boolean) => {
    try {
      await apiClient.put(`/admin/users/${encodeURIComponent(userId)}/status`, {
        status: suspend ? 'suspended' : 'active',
      });
      await loadUsers();
    } catch {
      /* handled */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email..."
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 w-64"
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'email', header: 'Email', sortable: true },
            { key: 'name', header: 'Name', sortable: true },
            {
              key: 'plan',
              header: 'Plan',
              render: (u) => (
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {String(u.plan || 'Free')}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (u) => {
                const suspended = String(u.status) === 'suspended';
                return suspended ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                    Suspended
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                    Active
                  </span>
                );
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
                return (
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSuspend(String(u.id), !suspended)}
                      className={`text-xs font-medium ${
                        suspended
                          ? 'text-green-600 hover:text-green-800'
                          : 'text-red-600 hover:text-red-800'
                      }`}
                    >
                      {suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </div>
                );
              },
            },
          ]}
          data={users as unknown as Record<string, unknown>[]}
          keyField="id"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          expandRow={(u) => {
            const userId = String(u.id);
            const kids = childrenMap[userId];
            if (!kids) {
              loadChildren(userId);
              return <p className="text-sm text-gray-500">Loading children...</p>;
            }
            if (kids.length === 0) {
              return <p className="text-sm text-gray-500">No children registered.</p>;
            }
            return (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Children</p>
                {kids.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-900">{c.heroName}</span>
                    <span className="text-gray-500">{c.xp} XP</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {c.rank}
                    </span>
                    {c.lastActiveAt && (
                      <span className="text-gray-400 text-xs">
                        Last active: {new Date(c.lastActiveAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          }}
          emptyMessage="No users found"
        />
      )}
    </div>
  );
}
