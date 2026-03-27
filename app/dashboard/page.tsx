import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import DashboardPage from '@/app/dashboard/_dashboard';

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/');

  return <DashboardPage avatar={<UserAvatar />} />;
}
