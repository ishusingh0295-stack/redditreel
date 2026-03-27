import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import AdminShell from "./_shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/');

  const admin = {
    name:  session.user.name  ?? 'Admin',
    email: session.user.email ?? '',
    id:    session.user.id    ?? '',
  };

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return <AdminShell admin={admin} onSignOut={handleSignOut}>{children}</AdminShell>;
}
