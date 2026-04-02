/**
 * Feed Engine — TikTok-style diversified reel feed
 *
 * Strategy:
 *  1. Map search query → pool of subreddits
 *  2. Fetch all subs in parallel (batched)
 *  3. Shuffle each sub's reels independently
 *  4. Weighted round-robin merge (personalization boosts frequency)
 *  5. Enforce no-consecutive-same-subreddit constraint
 */

import type { ReelPost } from '@/app/api/reddit/route';

/* ─────────────────────────────────────────────────────────────
   Query → Subreddit pool mapping
───────────────────────────────────────────────────────────── */
const TOPIC_MAP: Record<string, string[]> = {
  animals:  ['NatureIsFuckingLit','aww','AnimalsBeingBros','rarepuppers','cats','dogs','Zoomies','wildlifephotography','HumansBeingBros','BeAmazed'],
  funny:    ['funny','Unexpected','instant_regret','therewasanattempt','facepalm','maybemaybemaybe','holdmybeer','AbruptChaos','ClipsThatFellOffReddit','youseeingthis'],
  gaming:   ['gaming','GamePhysics','PS5','XboxSeriesX','pcmasterrace','Minecraft','GTA','gifsofgaming','gamedev','nerdgaming'],
  sports:   ['sports','nba','soccer','nfl','cricket','MMA','hockey','baseball','tennis','AmazingAthletics','nextfuckinglevel','formula1'],
  cars:     ['IdiotsInCars','Roadcam','dashcam','cars','carporn','Justrolledintotheshop','AutoDetailing','formula1','rallying'],
  music:    ['Music','WeAreTheMusicMakers','listentothis','guitar','piano','hiphopheads','EDM','Metal','beatmakers','concerts'],
  tech:     ['technology','programming','webdev','ProgrammerHumor','Futurology','compsci','softwaregore','techsupportgore','MachineLearning'],
  science:  ['space','nasa','Astronomy','Physics','chemistry','biology','InterestingAsFuck','Damnthatsinteresting','woahdude','cosmology'],
  cooking:  ['GifRecipes','food','Cooking','FoodPorn','BBQ','Baking','MealPrepSunday','AskCulinary','grilling','sushi'],
  nature:   ['EarthPorn','NatureIsFuckingLit','wildlifephotography','Waterfalls','SkyPorn','BeachPorn','clouds','DesertPorn','springlifeporn'],
  fails:    ['Wellthatsucks','instant_regret','therewasanattempt','facepalm','CrappyDesign','mildlyinfuriating','ATBGE','Oopsie'],
  art:      ['Art','DigitalArt','drawing','painting','Sculpture','Illustration','ConceptArt','graffiti','PixelArt','animation'],
  coding:   ['programming','webdev','learnprogramming','reactjs','Python','javascript','rust','golang','devops','MachineLearning'],
  fitness:  ['fitness','bodybuilding','crossfit','running','yoga','bicycling','climbing','weightlifting','GymMotivation','progresspics'],
  general:  ['nextfuckinglevel','oddlysatisfying','interestingasfuck','Damnthatsinteresting','BeAmazed','woahdude','WTF','maybemaybemaybe','AbruptChaos','CrazyFuckingVideos'],
};

const NSFW_MAP: Record<string, string[]> = {
  default:  ['nsfw','nsfwvideos','nsfw_gifs','RealGirls','gonewild','Amateur','holdthemoan','PetiteGoneWild','Boobies','BigBoobs'],
  dance:    ['SexyDance','tiktoknsfw','NSFWhot','nsfwvideos','sexy_videos'],
  cosplay:  ['nsfwcosplay','cosplaynsfw','CosplayGirls'],
  gaming:   ['gamingnsfw','nsfwgaming'],
  gym:      ['thickfitness','FitNakedGirls'],
};

export function resolvePool(query: string, nsfw: boolean): string[] {
  const q = query.toLowerCase();

  if (nsfw) {
    if (q.match(/cosplay|anime/))    return NSFW_MAP.cosplay;
    if (q.match(/game|gaming/))      return NSFW_MAP.gaming;
    if (q.match(/dance|tiktok/))     return NSFW_MAP.dance;
    if (q.match(/gym|fit/))          return NSFW_MAP.gym;
    return NSFW_MAP.default;
  }

  if (q.match(/lion|tiger|bear|dog|cat|bird|elephant|whale|shark|wolf|animal|pet|wildlife/)) return TOPIC_MAP.animals;
  if (q.match(/funny|meme|fail|lol|humor|hilarious|comedy/))   return TOPIC_MAP.funny;
  if (q.match(/game|gaming|minecraft|fortnite|cod|valorant|gta|pokemon/)) return TOPIC_MAP.gaming;
  if (q.match(/sport|football|basketball|soccer|cricket|tennis|nba|nfl/)) return TOPIC_MAP.sports;
  if (q.match(/car|truck|crash|accident|drift|race|ferrari|lamborghini/)) return TOPIC_MAP.cars;
  if (q.match(/music|song|concert|guitar|piano|rap|hiphop/))   return TOPIC_MAP.music;
  if (q.match(/code|coding|programming|software|ai|robot/))    return TOPIC_MAP.coding;
  if (q.match(/science|space|physics|nasa|rocket|astronomy/))  return TOPIC_MAP.science;
  if (q.match(/food|cook|recipe|bake|chef|restaurant/))        return TOPIC_MAP.cooking;
  if (q.match(/nature|forest|ocean|mountain|waterfall|landscape/)) return TOPIC_MAP.nature;
  if (q.match(/art|draw|paint|creative|design|sketch/))        return TOPIC_MAP.art;
  if (q.match(/fit|gym|workout|exercise|run|lift/))            return TOPIC_MAP.fitness;
  if (q.match(/tech|technology|gadget|phone|computer/))        return TOPIC_MAP.tech;
  return TOPIC_MAP.general;
}

/* ─────────────────────────────────────────────────────────────
   Fisher-Yates shuffle (in-place)
───────────────────────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─────────────────────────────────────────────────────────────
   Weighted round-robin merge
   weights: { [subreddit]: number } — higher = more frequent
   Enforces no-consecutive-same-subreddit constraint
───────────────────────────────────────────────────────────── */
export function weightedRoundRobin(
  grouped: Record<string, ReelPost[]>,
  weights: Record<string, number>,
  targetCount: number
): ReelPost[] {
  // Build cursor map and shuffle each bucket
  const buckets: Record<string, ReelPost[]> = {};
  for (const [sub, reels] of Object.entries(grouped)) {
    buckets[sub] = shuffle([...reels]);
  }

  const cursors: Record<string, number> = {};
  for (const sub of Object.keys(buckets)) cursors[sub] = 0;

  // Normalise weights — default 1.0 for unknown subs
  const subs = Object.keys(buckets);
  const getWeight = (s: string) => Math.max(weights[s] ?? 1, 0.1);

  // Expand subs into a weighted sequence (repeat proportionally)
  // e.g. weight 2 means the sub appears twice as often in the rotation
  const maxWeight = Math.max(...subs.map(getWeight));
  const slots: string[] = [];
  for (const sub of subs) {
    const times = Math.round((getWeight(sub) / maxWeight) * 10);
    for (let i = 0; i < Math.max(times, 1); i++) slots.push(sub);
  }
  shuffle(slots);

  const result: ReelPost[] = [];
  let lastSub = '';
  let slotIdx = 0;
  let attempts = 0;
  const maxAttempts = targetCount * 6;

  while (result.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const sub = slots[slotIdx % slots.length];
    slotIdx++;

    // Skip if same as last (diversity constraint)
    if (sub === lastSub) continue;

    const cursor = cursors[sub];
    const bucket = buckets[sub];
    if (!bucket || cursor >= bucket.length) continue;

    result.push(bucket[cursor]);
    cursors[sub] = cursor + 1;
    lastSub = sub;
  }

  return result;
}

/* ─────────────────────────────────────────────────────────────
   Build personalization weights from UserActivity records
   Counts how many times user engaged with each subreddit
───────────────────────────────────────────────────────────── */
export function buildWeightsFromActivity(
  activities: Array<{ payload: string | null }>
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const act of activities) {
    if (!act.payload) continue;
    try {
      const p = JSON.parse(act.payload) as { subreddit?: string };
      if (p.subreddit) {
        counts[p.subreddit] = (counts[p.subreddit] ?? 1) + 0.5; // incremental boost
      }
    } catch { /* ignore malformed */ }
  }

  // Cap boost at 3x to avoid monopolising the feed
  for (const sub of Object.keys(counts)) {
    counts[sub] = Math.min(counts[sub], 3);
  }

  return counts;
}
