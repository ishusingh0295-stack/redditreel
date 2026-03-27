import { getAdminStats } from '@/app/actions/admin';
import AdminDashboardClient from './_dashboard';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = 'overview' } = await searchParams;
  const stats = await getAdminStats();

  return <AdminDashboardClient stats={stats} view={view} />;
}
