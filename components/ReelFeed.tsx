"use client";

import {
  useEffect, useRef, useState, useCallback, memo,
  startTransition, useTransition,
} from "react";
import Hls from "hls.js";
import {
  Heart, MessageCircle, ExternalLink, Volume2, VolumeX,
  ArrowBigUp, Play, Film, Image as Img, Flame, AlertCircle,
  Share2, ChevronDown, Bookmark,
} from "lucide-react";
import type { ReelPost } from "../app/api/reddit/route";

/* ── Helpers ── */
const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + "M"
  : n >= 1e3 ? (n / 1e3).toFixed(1) + "K"
  : String(n);

const ago = (utc: number) => {
  if (typeof window === "undefined") return "recently";
  const s = Date.now() / 1000 - utc;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
};

const hsl = (s: string) =>
  (s.charCodeAt(0) * 37 + (s.charCodeAt(1) || 0) * 13) % 360;

/* ── HLS attach helper ── */
function attachHls(
  video: HTMLVideoElement,
  src: string,
  isActive: boolean,
  onError?: () => void,
) {
  const isHls = src.includes(".m3u8");

  if (isHls && Hls.isSupported()) {
    const hls = new Hls({
      maxBufferLength: isActive ? 30 : 8,
      maxMaxBufferLength: isActive ? 60 : 16,
      enableWorker: true,
      lowLatencyMode: false,
    });
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (data.fatal) onError?.();
    });
    return () => hls.destroy();
  } else {
    video.src = src;
    const handler = () => onError?.();
    video.addEventListener("error", handler);
    return () => {
      video.removeEventListener("error", handler);
      video.src = "";
    };
  }
}

/* ════════════════════════════════════════
   Slot Overlay — UI rendered on top of a video slot
════════════════════════════════════════ */
interface SlotOverlayProps {
  reel: ReelPost;
  index: number;
  isActive: boolean;
  isSaved: boolean;
  playing: boolean;
  muted: boolean;
  progress: number;
  hasVid: boolean;
  hasImg: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onDoubleTap: () => void;
  onSave: (reel: ReelPost) => void;
  onSkip: () => void;
  liked: boolean;
  setLiked: (v: boolean) => void;
  heart: boolean;
}

const SlotOverlay = memo(function SlotOverlay({
  reel, index, isActive, isSaved, playing, muted, progress,
  hasVid, hasImg, onTogglePlay, onToggleMute, onDoubleTap,
  onSave, onSkip, liked, setLiked, heart,
}: SlotOverlayProps) {
  const bg = `hsl(${(index * 43) % 360},30%,7%)`;

  return (
    <>
      {/* gradient overlays */}
      <div className="overlay-top" style={{ position:"absolute",top:0,left:0,right:0,height:90,zIndex:5 }} />
      <div className="overlay-bottom" style={{ position:"absolute",inset:0,zIndex:5 }} />

      {/* tap to play / double-tap like */}
      <div
        style={{ position:"absolute",inset:0,zIndex:6,cursor:hasVid?"pointer":"default" }}
        onClick={hasVid ? onTogglePlay : undefined}
        onDoubleClick={onDoubleTap}
      />

      {/* heart pop */}
      {heart && (
        <div style={{ position:"absolute",top:"50%",left:"50%",zIndex:30,pointerEvents:"none",animation:"heartPop .9s ease both" }}>
          <Heart size={88} fill="#ff2d55" color="#ff2d55" />
        </div>
      )}

      {/* paused indicator */}
      {hasVid && !playing && isActive && (
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:12,pointerEvents:"none",width:60,height:60,borderRadius:"50%",background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Play size={22} fill="#fff" color="#fff" />
        </div>
      )}

      {/* top bar */}
      <div style={{ position:"absolute",top:0,left:0,right:0,zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"14px 14px 0" }}>
        <a href={`https://reddit.com/r/${reel.subreddit}`} target="_blank" rel="noopener noreferrer" className="glass-pill" style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 11px",textDecoration:"none",color:"#fff",fontSize:12,fontWeight:700 }}>
          <span style={{ color:"var(--accent)" }}>r/</span>
          {reel.subreddit}
          {reel.isNsfw && <span className="badge-nsfw">18+</span>}
        </a>
        {hasVid && (
          <button onClick={onToggleMute} className="glass-pill" style={{ width:36,height:36,border:"none",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }} aria-label={muted?"Unmute":"Mute"}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}
      </div>

      {/* right actions */}
      <div className="reel-actions">
        <div className="act-btn" role="button" tabIndex={0} onClick={() => setLiked(!liked)} onKeyDown={e => e.key==="Enter"&&setLiked(!liked)} aria-label={liked?"Unlike":"Like"}>
          <div className={`act-icon${liked?" is-active":""}`}>
            <Heart size={19} fill={liked?"#ff2d55":"none"} color={liked?"#ff2d55":"#fff"} />
          </div>
          <span style={{ fontSize:11,color:"#fff",fontWeight:600 }}>{fmt(reel.score+(liked?1:0))}</span>
        </div>

        <a className="act-btn" href={reel.permalink} target="_blank" rel="noopener noreferrer" aria-label="View comments" style={{ textDecoration:"none",color:"inherit" }}>
          <div className="act-icon"><MessageCircle size={19} color="#fff" /></div>
          <span style={{ fontSize:11,color:"#fff",fontWeight:600 }}>{fmt(reel.numComments)}</span>
        </a>

        <div className="act-btn" role="button" tabIndex={0} onClick={() => onSave(reel)} onKeyDown={e => e.key==="Enter"&&onSave(reel)} aria-label={isSaved?"Remove from saved":"Save reel"}>
          <div className={`act-icon${isSaved?" is-active":""}`}>
            <Bookmark size={19} fill={isSaved?"var(--accent)":"none"} color={isSaved?"var(--accent)":"#fff"} />
          </div>
          <span style={{ fontSize:11,color:"#fff",fontWeight:600 }}>{isSaved?"Saved":"Save"}</span>
        </div>

        <a className="act-btn" href={reel.permalink} target="_blank" rel="noopener noreferrer" aria-label="Open on Reddit" style={{ textDecoration:"none",color:"inherit" }}>
          <div className="act-icon"><ExternalLink size={17} color="#fff" /></div>
          <span style={{ fontSize:11,color:"#fff",fontWeight:600 }}>Reddit</span>
        </a>

        <div className="act-btn" aria-label="Upvote ratio">
          <div className="act-icon"><ArrowBigUp size={19} color="#fff" /></div>
          <span style={{ fontSize:11,color:"#fff",fontWeight:600 }}>{Math.round(reel.upvoteRatio*100)}%</span>
        </div>
      </div>

      {/* bottom info */}
      <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"18px 14px 28px",zIndex:10,paddingRight:76 }}>
        <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:8 }}>
          <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,hsl(${hsl(reel.author)},70%,50%),hsl(${(hsl(reel.author)+120)%360},70%,35%))`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff" }}>
            {(reel.author[0]??"u").toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize:12,fontWeight:700,color:"#fff",lineHeight:1.2 }}>u/{reel.author}</p>
            <p style={{ fontSize:10,color:"rgba(255,255,255,.5)",lineHeight:1.2 }}>{ago(reel.createdUtc)}</p>
          </div>
        </div>
        <p style={{ fontSize:13,color:"#fff",lineHeight:1.45,marginBottom:10,fontWeight:500,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden",textShadow:"0 1px 4px rgba(0,0,0,.6)" }}>
          {reel.title}
        </p>
        <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
          <span className="chip"><ArrowBigUp size={10} />{fmt(reel.score)}</span>
          <span className="chip">{reel.isVideo?<Film size={10}/>:<Img size={10}/>}{reel.isVideo?"Video":"Image"}</span>
          {reel.relevanceScore>80&&<span className="chip"><Flame size={10}/>Hot</span>}
        </div>
      </div>

      {/* progress bar */}
      {hasVid && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width:`${progress}%` }} />
        </div>
      )}
    </>
  );
});

/* ════════════════════════════════════════
   VideoSlot — one of the 3 persistent DOM slots
   Receives a reel assignment and position offset
════════════════════════════════════════ */
interface VideoSlotProps {
  reel: ReelPost | null;
  reelIndex: number;      // which index in the full reels array
  slotOffset: number;     // -1 (prev), 0 (current), +1 (next) in CSS translateY units
  isActive: boolean;
  isSaved: boolean;
  onSave: (reel: ReelPost) => void;
  onSkip: () => void;
}

function VideoSlot({ reel, reelIndex, slotOffset, isActive, isSaved, onSave, onSkip }: VideoSlotProps) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const hlsCleanupRef = useRef<(() => void) | null>(null);
  const currentSrcRef = useRef<string | null>(null);

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [heart, setHeart] = useState(false);
  const [vidErr, setVidErr] = useState(false);

  /* Attach / reattach HLS only when the src URL changes */
  const src = reel?.isVideo ? (reel.videoUrl ?? null) : null;

  useEffect(() => {
    const v = vidRef.current;
    if (!v || !src) {
      hlsCleanupRef.current?.();
      hlsCleanupRef.current = null;
      currentSrcRef.current = null;
      return;
    }
    if (src === currentSrcRef.current) return; // same URL → no reinit

    // teardown previous
    hlsCleanupRef.current?.();
    setVidErr(false);
    setProgress(0);
    setPlaying(false);
    currentSrcRef.current = src;

    const cleanup = attachHls(v, src, isActive, () => setVidErr(true));
    hlsCleanupRef.current = cleanup;
    return () => {
      cleanup();
      hlsCleanupRef.current = null;
      currentSrcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  /* Update HLS buffer config when active state changes without src change */
  useEffect(() => {
    // Nothing to do for native HLS (Safari); Hls.js exposes no live config mutate.
    // The next attachHls call (on next reel) will pick correct values.
  }, [isActive]);

  /* Play / pause based on isActive */
  useEffect(() => {
    const v = vidRef.current;
    if (!v || !src || vidErr) return;
    if (isActive) {
      v.currentTime = 0;
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
      v.currentTime = 0;
      setProgress(0);
    }
  }, [isActive, src, vidErr]);

  const onTimeUpdate = useCallback(() => {
    const v = vidRef.current;
    if (v?.duration) setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const togglePlay = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else v.play().then(() => setPlaying(true)).catch(() => {});
  }, [playing]);

  const doubleTap = useCallback(() => {
    setLiked(true);
    setHeart(true);
    setTimeout(() => setHeart(false), 900);
  }, []);

  if (!reel) return null;

  const hasVid = reel.isVideo && !!reel.videoUrl && !vidErr;
  const hasImg = !!reel.imageUrl;
  const bg = `hsl(${(reelIndex * 43) % 360},30%,7%)`;

  return (
    <div
      className="reel-slot"
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        transform: `translateY(${slotOffset * 100}%)`,
        transition: "transform 0.38s cubic-bezier(0.22,1,0.36,1)",
        background: bg,
        willChange: "transform",
      }}
      role="article"
      aria-label={reel.title}
    >
      {/* Media layer */}
      <div style={{ position:"absolute",inset:0 }}>
        {hasVid ? (
          <video
            ref={vidRef}
            muted={muted}
            loop
            playsInline
            onTimeUpdate={onTimeUpdate}
            onError={() => setVidErr(true)}
            style={{ width:"100%",height:"100%",objectFit:"contain",display:"block" }}
          />
        ) : hasImg ? (
          <img
            src={reel.imageUrl!}
            alt={reel.title}
            style={{ width:"100%",height:"100%",objectFit:"contain",display:"block" }}
          />
        ) : (
          <div style={{ width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:`linear-gradient(135deg,hsl(${hsl(reel.subreddit)},50%,9%),hsl(${(hsl(reel.subreddit)+60)%360},40%,5%))` }}>
            <AlertCircle size={48} color="var(--text-3)" strokeWidth={1} />
            <p style={{ color:"var(--text-3)",fontSize:13 }}>Media unavailable</p>
          </div>
        )}
      </div>

      {/* UI overlay */}
      <SlotOverlay
        reel={reel}
        index={reelIndex}
        isActive={isActive}
        isSaved={isSaved}
        playing={playing}
        muted={muted}
        progress={progress}
        hasVid={hasVid}
        hasImg={hasImg}
        onTogglePlay={togglePlay}
        onToggleMute={() => setMuted(m => !m)}
        onDoubleTap={doubleTap}
        onSave={onSave}
        onSkip={onSkip}
        liked={liked}
        setLiked={setLiked}
        heart={heart}
      />
    </div>
  );
}

/* ════════════════════════════════════════
   Skeleton / Empty / Loading
════════════════════════════════════════ */
function ReelSkeleton() {
  return (
    <div className="reel-slide" style={{ background:"var(--bg-base)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:16 }}>
      <div style={{ position:"absolute",top:14,left:14,display:"flex",gap:8 }}>
        <div className="skeleton" style={{ width:100,height:28,borderRadius:100 }} />
      </div>
      <div className="skeleton" style={{ position:"absolute",inset:0,borderRadius:0,opacity:0.6 }} />
      <div style={{ position:"absolute",right:14,bottom:110,display:"flex",flexDirection:"column",gap:18 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
            <div className="skeleton" style={{ width:44,height:44,borderRadius:"50%" }} />
            <div className="skeleton" style={{ width:28,height:10,borderRadius:4 }} />
          </div>
        ))}
      </div>
      <div style={{ paddingRight:76,display:"flex",flexDirection:"column",gap:8 }}>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <div className="skeleton" style={{ width:30,height:30,borderRadius:"50%",flexShrink:0 }} />
          <div className="skeleton" style={{ width:100,height:12,borderRadius:4 }} />
        </div>
        <div className="skeleton" style={{ width:"85%",height:13,borderRadius:4 }} />
        <div className="skeleton" style={{ width:"60%",height:13,borderRadius:4 }} />
        <div style={{ display:"flex",gap:6 }}>
          {[70,55,45].map(w => <div key={w} className="skeleton" style={{ width:w,height:22,borderRadius:100 }} />)}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:32,background:"var(--bg-base)" }}>
      <div style={{ width:72,height:72,borderRadius:20,background:"var(--accent-subtle)",border:"1px solid var(--accent-border)",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <Film size={32} color="var(--accent)" strokeWidth={1.5} />
      </div>
      <div style={{ textAlign:"center" }}>
        <p style={{ color:"var(--text-1)",fontWeight:700,fontSize:18,marginBottom:8 }}>Start with a search</p>
        <p style={{ color:"var(--text-2)",fontSize:13,lineHeight:1.55,maxWidth:240 }}>
          Type what you want to watch in the chat panel — AI will build a reel feed for you
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Feed container — Virtual 3-slot window
════════════════════════════════════════ */
interface Props {
  reels: ReelPost[];
  loading: boolean;
  onLoadMore: () => void;
  savedIds: Set<string>;
  onSaveReel: (reel: ReelPost) => void;
}

/* slot ring: index 0,1,2 maps to prev/current/next via modulo */
type SlotId = 0 | 1 | 2;

export default function ReelFeed({ reels, loading, onLoadMore, savedIds, onSaveReel }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [, startBgTransition] = useTransition();

  /* Touch swipe state */
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  /* Background prefetch tracking */
  const prefetchedUpTo = useRef(-1);

  /* Slot assignment ring:
     slotOf[globalIdx % 3] tells us which slotId holds that reel.
     We always keep:
       slot[(activeIdx-1+3)%3] = prev reel
       slot[activeIdx%3]       = current reel
       slot[(activeIdx+1)%3]   = next reel
  */

  /* Compute which global reel each slot displays */
  const slotReel = (offset: -1 | 0 | 1): ReelPost | null => {
    const idx = activeIdx + offset;
    return reels[idx] ?? null;
  };

  const slotOffset = (offset: -1 | 0 | 1): number => {
    // In CSS translateY: prev is -100%, current is 0%, next is +100%
    return offset;
  };

  /* Background feed prefetch */
  useEffect(() => {
    if (reels.length === 0) return;
    const threshold = activeIdx + 2; // when user is at N-2 from end triggers fetch
    // Trigger onLoadMore (background) when 5 from end
    if (activeIdx >= reels.length - 5 && !loading) {
      startBgTransition(() => { onLoadMore(); });
    }
    // Mark prefetch watermark
    if (prefetchedUpTo.current < threshold) {
      prefetchedUpTo.current = threshold;
    }
  }, [activeIdx, reels.length, loading, onLoadMore]);

  const goNext = useCallback(() => {
    setActiveIdx(i => Math.min(i + 1, reels.length - 1));
  }, [reels.length]);

  const goPrev = useCallback(() => {
    setActiveIdx(i => Math.max(i - 1, 0));
  }, []);

  const onSkipReel = useCallback(() => { goNext(); }, [goNext]);

  /* Touch handlers on the outer container */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    isSwiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.targetTouches[0].clientY - touchStartY.current;
    if (Math.abs(diff) > 10) isSwiping.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (!isSwiping.current) return;
    if (diff < -50) goNext();
    else if (diff > 50) goPrev();
    isSwiping.current = false;
  };

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") goNext();
      if (e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  if (loading && reels.length === 0) {
    return <div style={{ width:"100%",height:"100%" }}><ReelSkeleton /></div>;
  }
  if (!loading && reels.length === 0) return <EmptyState />;

  const prevReel = slotReel(-1);
  const currReel = slotReel(0);
  const nextReel = slotReel(1);

  return (
    <div style={{ width:"100%",height:"100%",background:"#000",display:"flex",justifyContent:"center" }}>
      <div
        style={{ width:"100%",maxWidth:460,position:"relative",height:"100%",backgroundColor:"var(--bg-base)",overflow:"hidden" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 3 persistent video slots — no unmount, only CSS transform changes */}
        <VideoSlot
          reel={prevReel}
          reelIndex={activeIdx - 1}
          slotOffset={-1}
          isActive={false}
          isSaved={prevReel ? savedIds.has(prevReel.id) : false}
          onSave={onSaveReel}
          onSkip={onSkipReel}
        />
        <VideoSlot
          reel={currReel}
          reelIndex={activeIdx}
          slotOffset={0}
          isActive={true}
          isSaved={currReel ? savedIds.has(currReel.id) : false}
          onSave={onSaveReel}
          onSkip={onSkipReel}
        />
        <VideoSlot
          reel={nextReel}
          reelIndex={activeIdx + 1}
          slotOffset={1}
          isActive={false}
          isSaved={nextReel ? savedIds.has(nextReel.id) : false}
          onSave={onSaveReel}
          onSkip={onSkipReel}
        />

        {/* Scroll hint on first reel */}
        {reels.length > 0 && activeIdx === 0 && (
          <div className="anim-bounceUp" style={{ position:"absolute",bottom:80,left:"50%",zIndex:50,display:"flex",flexDirection:"column",alignItems:"center",gap:3,pointerEvents:"none" }}>
            <ChevronDown size={20} color="rgba(255,255,255,.45)" />
            <p style={{ fontSize:11,color:"rgba(255,255,255,.4)",whiteSpace:"nowrap" }}>Swipe for next reel</p>
          </div>
        )}

        {/* Loading spinner at bottom while fetching more */}
        {loading && reels.length > 0 && (
          <div style={{ position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",zIndex:50,display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,.5)",backdropFilter:"blur(8px)",borderRadius:20,padding:"6px 14px" }}>
            <div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,.2)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }} />
            <span style={{ fontSize:11,color:"rgba(255,255,255,.7)" }}>Loading more…</span>
          </div>
        )}
      </div>
    </div>
  );
}
