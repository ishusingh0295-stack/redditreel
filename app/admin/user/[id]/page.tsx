import { redirect } from 'next/navigation';

// Legacy route — user management is now handled via the modal in /admin?view=users
export default async function ManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin?view=users&user=${id}`);
}
