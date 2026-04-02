import { NextRequest, NextResponse } from 'next/server';
import { prisma, auth } from '@/auth';
import { resolvePool, weightedRoundRobin, buildWeightsFromActivity } from '@/lib/feedEngine';

/* ─────────────────────────────────────────────────────────────
   Auth + Analytics helpers
───────────────────────────────────────────────────────────── */
async function requireAuth(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  return null;
}

async function trackSearchQuery(query: string) {
  if (!query?.trim()) return;
  const normalized = query.trim().toLowerCase();
  await prisma.searchQuery.upsert({
    where:  { query: normalized },
    create: { query: normalized, hits: 1 },
    update: { hits: { increment: 1 } },
  });
}

async function trackUserActivity(type: string, data: Record<string, unknown> = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;
    await prisma.userActivity.create({
      data: { userId: session.user.id, type, payload: JSON.stringify(data) },
    });
  } catch { /* ignore */ }
}

/* ─────────────────────────────────────────────────────────────
   Reddit OAuth token (server-side, cached)
───────────────────────────────────────────────────────────── */
let _tokenCache: { token: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  if (_tokenCache && Date.now() < _tokenCache.expires) return _tokenCache.token;
  const id  = process.env.REDDIT_CLIENT_ID;
  const sec = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !sec) return null;
  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${sec}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':   'RedditReelAI/2.0 by RedditReelDev',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.access_token) return null;
    _tokenCache = { token: d.access_token, expires: Date.now() + (d.expires_in - 120) * 1000 };
    return _tokenCache.token;
  } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface RedditChild {
  data: {
    id: string; title: string; subreddit: string; author: string;
    score: number; num_comments: number; url: string; permalink: string;
    thumbnail: string; is_video: boolean; over_18: boolean;
    media?: { reddit_video?: { fallback_url: string; hls_url: string } };
    secure_media?: { reddit_video?: { fallback_url: string; hls_url: string } };
    preview?: {
      images?: Array<{ source: { url: string }; resolutions: Array<{ url: string }> }>;
      reddit_video_preview?: { fallback_url: string };
    };
    crosspost_parent_list?: RedditChild['data'][];
    post_hint?: string; domain?: string;
    created_utc: number; upvote_ratio: number; gilded: number;
  };
}

export interface ReelPost {
  id: string; title: string; subreddit: string; author: string;
  score: number; numComments: number; permalink: string;
  videoUrl: string | null; imageUrl: string | null;
  isVideo: boolean; isNsfw: boolean; createdUtc: number;
  upvoteRatio: number; thumbnail: string | null; relevanceScore: number;
}

/* ─────────────────────────────────────────────────────────────
   Fetch one subreddit page
───────────────────────────────────────────────────────────── */
async function fetchSub(
  sub: string,
  sort: string,
  limit: number,
  after?: string
): Promise<{ posts: RedditChild['data'][]; nextAfter: string | null }> {
  const qs = `?limit=${limit}&raw_json=1${after ? `&after=${after}` : ''}`;
  const token = await getToken();

  const tryFetch = async (base: string, headers: HeadersInit) => {
    const res = await fetch(`${base}/r/${sub}/${sort}.json${qs}`, {
      headers,
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  };

  let data: { data?: { children?: RedditChild[]; after?: string | null } } | null = null;

  if (token) {
    try {
      data = await tryFetch('https://oauth.reddit.com', {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'RedditReelAI/2.0',
      });
    } catch { /* fall through */ }
  }

  if (!data) {
    try {
      data = await tryFetch('https://www.reddit.com', {
        'User-Agent': 'RedditReelAI/2.0',
        Accept: 'application/json',
      });
    } catch { return { posts: [], nextAfter: null }; }
  }

  return {
    posts: (data?.data?.children ?? []).map((c: RedditChild) => c.data),
    nextAfter: data?.data?.after ?? null,
  };
}

/* ─────────────────────────────────────────────────────────────
   Media extraction
───────────────────────────────────────────────────────────── */
function extractMedia(post: RedditChild['data']): {
  videoUrl: string | null; imageUrl: string | null; isVideo: boolean;
} {
  const rv = post.media?.reddit_video || post.secure_media?.reddit_video;
  if (rv) return {
    videoUrl: (rv.hls_url ?? rv.fallback_url)?.replace(/&amp;/g, '&') ?? null,
    imageUrl: post.thumbnail?.startsWith('http') ? post.thumbnail : null,
    isVideo: true,
  };

  if (post.crosspost_parent_list?.length) {
    const cp = post.crosspost_parent_list[0];
    const crv = cp.media?.reddit_video || cp.secure_media?.reddit_video;
    if (crv) return {
      videoUrl: (crv.hls_url ?? crv.fallback_url)?.replace(/&amp;/g, '&') ?? null,
      imageUrl: null, isVideo: true,
    };
  }

  const pv = post.preview?.reddit_video_preview;
  if (pv) return { videoUrl: pv.fallback_url?.replace(/&amp;/g, '&') ?? null, imageUrl: null, isVideo: true };

  if (post.url?.match(/\.(mp4|webm|gifv)$/i))
    return { videoUrl: post.url.replace(/\.gifv$/i, '.mp4'), imageUrl: null, isVideo: true };
  if (post.url?.match(/\.gif$/i))
    return { videoUrl: null, imageUrl: post.url, isVideo: false };

  const img = post.preview?.images?.[0];
  if (img) {
    const src = img.source?.url?.replace(/&amp;/g, '&');
    if (src) return { videoUrl: null, imageUrl: src, isVideo: false };
  }

  if (post.thumbnail?.startsWith('http'))
    return { videoUrl: null, imageUrl: post.thumbnail, isVideo: false };

  return { videoUrl: null, imageUrl: null, isVideo: false };
}

function hasMedia(post: RedditChild['data']): boolean {
  const { videoUrl, imageUrl } = extractMedia(post);
  return !!(videoUrl || imageUrl) && (
    post.is_video ||
    post.post_hint === 'image' ||
    post.post_hint === 'rich:video' ||
    post.post_hint === 'hosted:video' ||
    !!post.preview?.images?.length ||
    !!(post.url?.match(/\.(mp4|webm|gif|gifv)$/i)) ||
    !!(post.domain?.match(/gfycat|redgifs|imgur|v\.redd\.it/))
  );
}

function toReelPost(post: RedditChild['data']): ReelPost {
  const { videoUrl, imageUrl, isVideo } = extractMedia(post);
  const score =
    Math.log10(Math.max(post.score, 1)) * 20 +
    Math.log10(Math.max(post.num_comments, 1)) * 8 +
    post.upvote_ratio * 15 +
    (post.is_video ? 10 : 0);

  return {
    id: post.id, title: post.title, subreddit: post.subreddit, author: post.author,
    score: post.score, numComments: post.num_comments,
    permalink: `https://reddit.com${post.permalink}`,
    videoUrl, imageUrl, isVideo, isNsfw: post.over_18,
    createdUtc: post.created_utc, upvoteRatio: post.upvote_ratio,
    thumbnail: post.thumbnail?.startsWith('http') ? post.thumbnail : null,
    relevanceScore: Math.round(score),
  };
}

/* ─────────────────────────────────────────────────────────────
   Parallel fetch — all subs in the pool at once (batched)
───────────────────────────────────────────────────────────── */
async function fetchAllSubs(
  pool: string[],
  sort: string,
  perSub: number,
  nsfw: boolean,
  seenIds: Set<string>
): Promise<Record<string, ReelPost[]>> {
  // Fetch all subs in parallel, max 10 concurrent
  const BATCH = 10;
  const grouped: Record<string, ReelPost[]> = {};

  for (let i = 0; i < pool.length; i += BATCH) {
    const batch = pool.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(sub => fetchSub(sub, sort, perSub))
    );

    results.forEach((result, idx) => {
      const sub = batch[idx];
      if (result.status !== 'fulfilled') return;

      const reels: ReelPost[] = [];
      for (const post of result.value.posts) {
        if (seenIds.has(post.id)) continue;
        if (!hasMedia(post)) continue;
        if (!nsfw && post.over_18) continue;
        if (nsfw && !post.over_18 && Math.random() > 0.3) continue;
        reels.push(toReelPost(post));
      }

      if (reels.length > 0) grouped[sub] = reels;
    });
  }

  return grouped;
}

/* ─────────────────────────────────────────────────────────────
   MAIN ROUTE
───────────────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const sp    = request.nextUrl.searchParams;
  const query = sp.get('query') || 'trending videos';
  const nsfw  = sp.get('nsfw') === 'true';
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '25'), 10), 50);

  // Pagination / state from client
  const subsParam   = sp.get('subs') ?? '';
  const seenIdsRaw  = sp.get('seenIds') ?? '';
  const seenIds     = new Set<string>(seenIdsRaw.split(',').filter(Boolean));

  // Analytics (non-blocking)
  trackSearchQuery(query).catch(() => {});
  trackUserActivity('search', { query, nsfw }).catch(() => {});

  try {
    // 1. Resolve subreddit pool
    const pool = subsParam ? subsParam.split(',') : resolvePool(query, nsfw);

    // 2. Detect sort
    const sort: 'hot' | 'top' | 'new' = nsfw
      ? 'top'
      : query.toLowerCase().match(/top|best|popular|trending|viral/)
        ? 'top'
        : query.toLowerCase().match(/new|latest|recent/)
          ? 'new'
          : 'hot';

    // 3. Fetch all subs in parallel (~20 reels each for good variety)
    const perSub = Math.max(Math.ceil(limit * 1.5), 20);
    const grouped = await fetchAllSubs(pool, sort, perSub, nsfw, seenIds);

    if (Object.keys(grouped).length === 0) {
      return NextResponse.json({ success: true, reels: [], pagination: { subs: pool.join(',') }, meta: { query, nsfw, total: 0 } });
    }

    // 4. Load personalization weights from user activity
    let weights: Record<string, number> = {};
    try {
      const session = await auth();
      if (session?.user?.id) {
        const activities = await prisma.userActivity.findMany({
          where:   { userId: session.user.id, type: 'watch' },
          select:  { payload: true },
          orderBy: { createdAt: 'desc' },
          take:    200, // last 200 watch events
        });
        weights = buildWeightsFromActivity(activities);
      }
    } catch { /* personalization is best-effort */ }

    // 5. Weighted round-robin merge with diversity constraint
    // Request extra to have buffer for preload (next 25+)
    const reels = weightedRoundRobin(grouped, weights, limit + 25);

    return NextResponse.json({
      success: true,
      reels,
      pagination: {
        subs: pool.join(','),
        // Pass back seen IDs so next call can deduplicate
        newSeenIds: reels.map(r => r.id).join(','),
      },
      meta: { query, nsfw, sort, total: reels.length, subsUsed: Object.keys(grouped).length },
    });

  } catch (err) {
    console.error('[Reddit API]', err);
    return NextResponse.json({ success: false, error: 'Fetch failed', reels: [] }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/reddit — track watch events for personalization
───────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ ok: false }, { status: 401 });

    const body = await request.json() as { type?: string; subreddit?: string };
    if (body.type === 'watch' && body.subreddit) {
      await prisma.userActivity.create({
        data: {
          userId:  session.user.id,
          type:    'watch',
          payload: JSON.stringify({ subreddit: body.subreddit }),
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
