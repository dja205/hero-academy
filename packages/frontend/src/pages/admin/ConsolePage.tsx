import { AdminLayout } from '../../components/admin/AdminLayout';

/**
 * Admin console page — layout shell with sidebar navigation.
 * Nested routes render into the AdminLayout's <Outlet />.
 */
export function ConsolePage() {
  return <AdminLayout />;
}
