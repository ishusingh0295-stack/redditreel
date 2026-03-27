'use server'

import { prisma, auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') throw new Error("Forbidden");
  return session;
}

export async function getAdminStats() {
  await checkAdmin();

  const [usersCount, reelsCount, notesCount, nsfwCount, dauGroup, subreddits, mostSearchedQueries, userGrowthRaw, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.savedReel.count(),
    prisma.note.count(),
    prisma.savedReel.count({ where: { isNsfw: true } }),
    prisma.session.groupBy({
      by: ['userId'],
      where: { expires: { gte: new Date(Date.now() - 86400_000) } },
    }),
    prisma.savedReel.groupBy({
      by: ['subreddit'],
      _count: { _all: true },
      orderBy: { _count: { subreddit: 'desc' } },
      take: 10,
    }),
    prisma.searchQuery.findMany({ orderBy: { hits: 'desc' }, take: 10 }),
    prisma.user.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 90 * 86400_000) } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, name: true, email: true, role: true,
        createdAt: true, suspended: true,
        _count: { select: { savedReels: true, notes: true, activities: true } },
      },
    }),
  ]);

  const userGrowth = userGrowthRaw.reduce((acc, u) => {
    const day = u.createdAt.toISOString().slice(0, 10);
    const item = acc.find(e => e.date === day);
    if (item) item.count += 1;
    else acc.push({ date: day, count: 1 });
    return acc;
  }, [] as Array<{ date: string; count: number }>);

  return {
    usersCount,
    reelsCount,
    notesCount,
    dau: dauGroup.length,
    nsfwCount,
    sfwCount: reelsCount - nsfwCount,
    subreddits,
    mostSearchedQueries,
    userGrowth,
    recentUsers: recentUsers.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

export async function getUserDetail(userId: string) {
  await checkAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      savedReels: { orderBy: { savedAt: 'desc' }, take: 50 },
      notes: { orderBy: { createdAt: 'desc' }, take: 50 },
      activities: { orderBy: { createdAt: 'desc' }, take: 30 },
    },
  });
  if (!user) throw new Error("User not found");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    suspended: user.suspended ?? false,
    createdAt: user.createdAt.toISOString(),
    reels: user.savedReels.map(r => ({
      id: r.id, title: r.title, subreddit: r.subreddit,
      isNsfw: r.isNsfw, isVideo: r.isVideo,
      permalink: r.permalink, videoUrl: r.videoUrl, imageUrl: r.imageUrl,
      savedAt: r.savedAt.toISOString(),
    })),
    notes: user.notes.map(n => ({
      id: n.id, text: n.text, createdAt: n.createdAt.toISOString(),
    })),
    activities: user.activities.map(a => ({
      id: a.id, type: a.type, payload: a.payload,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export async function getUserContentAction(userId: string) {
  return getUserDetail(userId);
}

export async function suspendUserAction(userId: string) {
  const session = await checkAdmin();
  if (session.user.id === userId) throw new Error("Cannot suspend yourself");
  await prisma.user.update({ where: { id: userId }, data: { suspended: true } });
  revalidatePath('/admin');
}

export async function activateUserAction(userId: string) {
  await checkAdmin();
  await prisma.user.update({ where: { id: userId }, data: { suspended: false } });
  revalidatePath('/admin');
}

export async function deleteUserAction(id: string) {
  const session = await checkAdmin();
  if (session.user.id === id) throw new Error("Cannot delete yourself");
  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin');
}

export async function adminDeleteReelAction(id: string) {
  await checkAdmin();
  await prisma.savedReel.delete({ where: { id } });
}

export async function adminDeleteNoteAction(id: string) {
  await checkAdmin();
  await prisma.note.delete({ where: { id } });
}
