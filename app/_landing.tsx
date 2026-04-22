"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import dynamic from "next/dynamic";
import AppIcon from "@/components/AppIcon";
import LoginModal from "@/components/LoginModal";
import NavActionsClient from "@/components/NavActionsClient";
import {
  Film,
  MessageCircle,
  BookMarked,
  Infinity as InfinityIcon,
  ShieldCheck,
  StickyNote,
  Zap,
  ArrowRight,
  Play,
} from "lucide-react";

/* ══════════════════════════════════════
   LENIS SMOOTH SCROLL INIT
   Fix: Load only after component mount to prevent hydration issues
══════════════════════════════════════ */
function useLenis() {
  useEffect(() => {
    let lenis: any;
    import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    });
    return () => lenis?.destroy();
  }, []);
}

/* ══════════════════════════════════════
   GLITCH TEXT COMPONENT
══════════════════════════════════════ */
function GlitchText({ children }: { children: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          color: "#00ffcc",
          animation: "glitch1 3.5s infinite",
          clipPath: "polygon(0 20%, 100% 20%, 100% 40%, 0 40%)",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          color: "#ff2d55",
          animation: "glitch2 3.5s infinite",
          clipPath: "polygon(0 60%, 100% 60%, 100% 75%, 0 75%)",
        }}
      >
        {children}
      </span>
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
}

/* ══════════════════════════════════════
   FLOATING REEL CARD
══════════════════════════════════════ */
interface ReelCardProps {
  delay: number;
  rotate: number;
  translateX: string;
  translateY: string;
  width: number;
  height: number;
  videoSrc?: string; // Made optional
  imageSrc?: string; // Added imageSrc as optional
  poster?: string;
  subreddit: string;
  title: string;
  author: string;
  progress?: number;
  zIndex?: number;
  scale?: number;
}

function FloatingCard({
  delay,
  rotate,
  translateX,
  translateY,
  width,
  height,
  videoSrc,
  imageSrc,
  poster,
  subreddit,
  title,
  author,
  progress,
  zIndex = 1,
  scale: scaleProp = 1,
  isMounted = false, // Fix: Add mounted prop to control animations
}: ReelCardProps & { isMounted?: boolean }) {
  const fs = (base: number) => Math.round(base * (width / 260));

  return (
    <motion.div
      initial={false} // Fix: Disable initial animation
      animate={isMounted ? { opacity: 1, scale: scaleProp, rotate } : { opacity: 0, scale: scaleProp * 0.85, rotate: rotate - 10 }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -(height / 2),
        marginLeft: -(width / 2),
        transformOrigin: "center center",
        borderRadius: 22,
        overflow: "hidden",
        width,
        height,
        zIndex,
        border: "1px solid rgba(255,255,255,.14)",
        boxShadow: `0 ${24 + zIndex * 12}px ${60 + zIndex * 20}px rgba(0,0,0,${0.55 + zIndex * 0.08}), 0 0 0 1px rgba(255,45,85,.08)`,
        background: "#0a0a0a",
      }}
    >
      {/* Video or Image */}
      {videoSrc ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={poster}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : imageSrc ? (
        <img
          src={imageSrc}
          alt={title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}

      {/* Gradient overlay — identical across all cards */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.2) 50%, transparent 100%)",
        }}
      />

      {/* Subreddit badge — identical across all cards */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          background: "rgba(0,0,0,.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 100,
          padding: `${fs(4)}px ${fs(10)}px`,
          fontSize: fs(11),
          fontWeight: 700,
          lineHeight: 1,
          color: "#fff",
        }}
      >
        <span style={{ color: "#ff2d55" }}>r/</span>
        {subreddit}
      </div>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: fs(11),
            fontWeight: 600,
            color: "rgba(255,255,255,.95)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </p>

        {/* Author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: fs(22),
              height: fs(22),
              borderRadius: "50%",
              flexShrink: 0,
              background: "linear-gradient(135deg,#ff2d55,#ff7055)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fs(9),
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {author[0].toUpperCase()}
          </div>
          <span
            style={{
              fontSize: fs(10),
              color: "rgba(255,255,255,.55)",
              fontWeight: 500,
            }}
          >
            u/{author}
          </span>
        </div>

        {/* Progress bar — only on primary card */}
        {progress !== undefined && (
          <div
            style={{
              marginTop: 10,
              height: 3,
              borderRadius: 2,
              background: "rgba(255,255,255,.12)",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 2,
                background: "#ff2d55",
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════
   FEATURES DATA
══════════════════════════════════════ */
const FEATURES = [
  {
    icon: <MessageCircle size={22} />,
    title: "AI Chat Search",
    desc: "Speak naturally. Our AI maps your intent to the perfect Reddit communities, instantly.",
  },
  {
    icon: <Film size={22} />,
    title: "Infinite Reel Feed",
    desc: "Full-screen scroll-snap video player. Auto-plays, auto-loads — no buffering, no friction.",
  },
  {
    icon: <InfinityIcon size={22} />,
    title: "Never-Ending Content",
    desc: "Smart cursor-based pagination fetches fresh reels before you even notice you need them.",
  },
  {
    icon: <BookMarked size={22} />,
    title: "Boards & Collections",
    desc: "Save your favourite reels into custom boards. Drag-to-sort, tag, and organise with ease.",
  },
  {
    icon: <StickyNote size={22} />,
    title: "Quick Notes",
    desc: "Jot ideas alongside your feed — synced to your account, always with you.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Secure & Private",
    desc: "JWT-based sessions, bcrypt-hashed passwords. Your data stays yours. Always.",
  },
];

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function LandingPage({
  navActions,
}: {
  navActions: React.ReactNode;
}) {
  useLenis();
  const router = useRouter();
  const searchParams = useSearchParams();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const [loginOpen, setLoginOpen] = useState(false);
  const openLogin = () => setLoginOpen(true);

  // Auto-open modal when redirected from a protected route (?auth=1)
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      setLoginOpen(true);
      // Clean the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      url.searchParams.delete("callbackUrl");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Fix: Responsive check - start with false to match SSR, update after mount
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Typing animation for badge - Fix: Start with full text to prevent hydration mismatch */
  const badgeText = "Just launched — be among the first";
  const [typed, setTyped] = useState(badgeText); // Start with full text for SSR
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    // Only animate on client after mount
    setTyped("");
    setIsAnimating(true);
    let i = 0;
    const id = setInterval(() => {
      setTyped(badgeText.slice(0, i + 1));
      if (++i >= badgeText.length) {
        clearInterval(id);
        setIsAnimating(false);
      }
    }, 42);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        callbackUrl={callbackUrl}
      />
      {/* ── Glitch keyframes ── */}
      <style>{`
        @keyframes glitch1 {
          0%,100%{transform:translate(0)}
          7%{transform:translate(-3px,1px)}
          10%{transform:translate(0)}
          42%{transform:translate(-2px,0)}
          44%{transform:translate(0)}
        }
        @keyframes glitch2 {
          0%,100%{transform:translate(0)}
          3%{transform:translate(3px,-1px)}
          6%{transform:translate(0)}
          48%{transform:translate(2px,1px)}
          50%{transform:translate(0)}
        }
        @keyframes marquee {
          from{transform:translateX(0)}
          to{transform:translateX(-50%)}
        }
        .feature-card:hover{
          border-color:rgba(255,45,85,.4)!important;
          transform:translateY(-4px)!important;
          box-shadow:0 16px 40px rgba(255,45,85,.15)!important;
        }
        .nav-link:hover, .nav-link-btn:hover{color:#fff!important}
        .cta-btn:hover, .cta-btn-nav:hover{transform:translateY(-2px)!important;box-shadow:0 12px 32px rgba(255,45,85,.5)!important}
      `}</style>

      <main
        style={{
          minHeight: "100dvh",
          background: "#000",
          color: "#fff",
          fontFamily: "'Inter', system-ui, sans-serif",
          overflowX: "hidden",
          position: "relative",
          scrollBehavior: "auto",
        }}
      >
        {/* ══ STICKY NAV ══ */}
        <motion.nav
          initial={false} // Fix: Disable initial animation to prevent layout shift
          animate={isMounted ? { y: 0, opacity: 1 } : { y: -80, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="landing-nav"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 clamp(20px, 5vw, 72px)",
            height: 68,
            background: "rgba(0,0,0,.75)",
            backdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(255,255,255,.07)",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AppIcon size={34} />
            <span
              className="landing-nav-logo-text"
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-.4px",
              }}
            >
              Reddit Reel{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#ff2d55,#ff7055)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AI
              </span>
            </span>
          </div>
          {/* Nav actions — server-rendered, client click wired via NavActionsClient */}
          <div className="landing-nav-actions">
            <NavActionsClient onLogin={openLogin}>
              {navActions}
            </NavActionsClient>
          </div>
        </motion.nav>

        {/* ══ HERO SECTION ══ */}
        <motion.section
          ref={heroRef}
          className="hero-section"
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(40px, 6vw, 80px)",
            padding: "clamp(24px, 6vw, 100px)",
            paddingTop: "calc(68px + clamp(32px, 6vh, 60px))",
            paddingBottom: "clamp(40px, 6vh, 80px)",
            position: "relative",
            overflow: "visible",
            opacity: isMounted ? heroOpacity : 1, // Fix: Prevent opacity flash on mount
          }}
        >
          {/* Background grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              backgroundImage: `
              linear-gradient(rgba(255,45,85,.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,45,85,.04) 1px, transparent 1px)
            `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Background glow */}
          <motion.div
            style={{
              y: heroBgY,
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5%",
                left: "-10%",
                width: "70vw",
                height: "70vw",
                maxWidth: 900,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,45,85,.15) 0%, transparent 65%)",
              }}
            />
          </motion.div>

          {/* ── LEFT COLUMN — text content ── */}
          <div
            className="hero-content"
            style={{
              position: "relative",
              zIndex: 10,
              flex: "1 1 0",
              minWidth: 0,
              maxWidth: 600,
            }}
          >
            {/* Badge */}
            <motion.div
              initial={false} // Fix: Disable initial animation
              animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 100,
                background: "rgba(255,45,85,.12)",
                border: "1px solid rgba(255,45,85,.3)",
                fontSize: 12,
                fontWeight: 700,
                color: "#ff7090",
                marginBottom: 28,
                letterSpacing: ".3px",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <span style={{ fontSize: 8, color: "#ff2d55" }}>●</span>
              {typed}
              {isAnimating && (
                <span
                  style={{
                    animation: "glitch1 1s infinite",
                    opacity: typed.length < badgeText.length ? 1 : 0,
                  }}
                >
                  |
                </span>
              )}
            </motion.div>

            {/* Main Heading */}
            <div style={{ overflow: "hidden", marginBottom: 8 }}>
              <motion.h1
                initial={false} // Fix: Disable initial animation
                animate={isMounted ? { y: 0 } : { y: "100%" }}
                transition={{
                  duration: 0.85,
                  delay: 0.25,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(52px, 8.5vw, 96px)",
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: "-3px",
                  margin: 0,
                }}
              >
                AI-Powered
              </motion.h1>
            </div>
            <div style={{ overflow: "hidden", marginBottom: 24 }}>
              <motion.div
                initial={false} // Fix: Disable initial animation
                animate={isMounted ? { y: 0 } : { y: "100%" }}
                transition={{
                  duration: 0.85,
                  delay: 0.38,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(52px, 8.5vw, 96px)",
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: "-3px",
                }}
              >
                Reddit{" "}
                <span
                  className="hero-title-part"
                  style={{
                    color: "#ff2d55",
                    textShadow: "0 0 40px rgba(255,45,85,.5)",
                  }}
                >
                  Reels
                </span>
              </motion.div>
            </div>

            {/* Sub-headline */}
            <motion.p
              initial={false} // Fix: Disable initial animation
              animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              style={{
                fontSize: "clamp(14px, 1.8vw, 17px)",
                color: "rgba(255,255,255,.5)",
                lineHeight: 1.65,
                maxWidth: 420,
                marginBottom: 40,
              }}
            >
              Packed with lightning-fast AI search, infinite video scroll, smart
              boards &amp; notes. The first Reddit video experience built
              entirely around{" "}
              <em
                style={{ color: "rgba(255,255,255,.75)", fontStyle: "normal" }}
              >
                your taste
              </em>
              .
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={false} // Fix: Disable initial animation
              animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="hero-ctas"
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={openLogin}
                id="hero-cta"
                className="cta-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "clamp(14px, 1.8vw, 18px) clamp(28px, 3vw, 44px)",
                  borderRadius: 12,
                  fontSize: "clamp(14px, 1.5vw, 16px)",
                  fontWeight: 800,
                  background: "#ff2d55",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(255,45,85,.45)",
                  transition: "transform .2s, box-shadow .2s",
                }}
              >
                Start for Free <ArrowRight size={16} />
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  color: "rgba(255,255,255,.4)",
                  fontWeight: 500,
                }}
              >
                <div style={{ display: "flex" }}>
                  {["#ff2d55", "#ff7055", "#ffa040"].map((c, i) => (
                    <div
                      key={i}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg,${c},${c}99)`,
                        border: "2px solid #000",
                        marginLeft: i > 0 ? -10 : 0,
                      }}
                    />
                  ))}
                </div>
                Be among the first users
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — stacked card deck ── */}
          <div
            className="hero-cards"
            style={{
              position: "relative",
              zIndex: 5,
              flex: isMobile ? "none" : "0 0 300px",
              width: isMobile ? "100%" : 300,
              height: isMobile ? 360 : 420,
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              transform: isMobile ? "none" : "translateX(-120px)",
            }}
          >
            {/* Card 3 — back (most rotated, smallest, lowest z) */}
            <FloatingCard
              delay={0.9}
              rotate={-18}
              translateX="0%"
              translateY="0%"
              width={isMobile ? 180 : 260}
              height={isMobile ? 280 : 400}
              zIndex={1}
              scale={0.88}
              imageSrc="https://i.redd.it/22il2bd2puyc1.png"
              subreddit="Animewallpaper"
              title="Lize Helesta [Nijisanji]"
              author="V-Artiste"
              isMounted={isMounted}
            />

            {/* Card 2 — middle */}
            <FloatingCard
              delay={0.7}
              rotate={10}
              translateX="0%"
              translateY="0%"
              width={isMobile ? 180 : 260}
              height={isMobile ? 280 : 400}
              zIndex={2}
              scale={0.94}
              imageSrc="https://i.redd.it/p3jyhk47iurg1.png"
              subreddit="PrettyGirls"
              title="Olivia King — Natural Light"
              author="PortraitPro"
              isMounted={isMounted}
            />

            {/* Card 1 — front (least rotated, full size, highest z) */}
            <FloatingCard
              delay={0.5}
              rotate={-3}
              translateX="0%"
              translateY="0%"
              width={isMobile ? 180 : 260}
              height={isMobile ? 280 : 400}
              zIndex={3}
              scale={1}
              videoSrc="https://v.redd.it/tczku5gpr8d61/DASH_720.mp4?source=fallback"
              poster="https://external-preview.redd.it/tczku5gpr8d61.png?format=pjpg&auto=webp&s=555abf89aa0bb73603aadc7aab27a20fb990ba8"
              subreddit="NatureIsFuckingLit"
              title="Breathtaking flower timelapse"
              author="nature_lover"
              progress={65}
              isMounted={isMounted}
            />
          </div>

          {/* Scroll hint - only show after mount */}
          {isMounted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="scroll-hint"
              style={{
                position: "absolute",
                bottom: 30,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 24,
                  height: 38,
                  borderRadius: 12,
                  border: "1.5px solid rgba(255,255,255,.2)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: 6,
                }}
              >
                <motion.div
                  animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.4)",
                  }}
                />
              </motion.div>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,.25)",
                  letterSpacing: ".5px",
                  textTransform: "uppercase",
                }}
              >
                scroll
              </span>
            </motion.div>
          )}
        </motion.section>

        {/* ══ MARQUEE STRIP ══ */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,.06)",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            padding: "16px 0",
            overflow: "hidden",
            background: "rgba(255,45,85,.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              animation: "marquee 20s linear infinite",
              width: "max-content",
            }}
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 48,
                  paddingLeft: 48,
                  whiteSpace: "nowrap",
                }}
              >
                {[
                  "AI Chat Search",
                  "Infinite Reels",
                  "Smart Boards",
                  "Quick Notes",
                  "NSFW Mode",
                  "Secure Auth",
                  "100% Free to Start",
                ].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "rgba(255,255,255,.25)",
                      letterSpacing: ".5px",
                    }}
                  >
                    <span style={{ color: "#ff2d55", marginRight: 8 }}>✦</span>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ══ FEATURES SECTION ══ */}
        <FeaturesSection isMobile={isMobile} />

        {/* ══ CTA BANNER ══ */}
        <CtaBanner onLogin={openLogin} isMobile={isMobile} />

        {/* ══ BRAND FOOTER ══ */}
        <BrandFooter onLogin={openLogin} isMobile={isMobile} />
      </main>
    </>
  );
}

/* ══════════════════════════════════════
   FEATURES SECTION (scroll-animated)
══════════════════════════════════════ */
function FeaturesSection({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="features-section"
      style={{
        padding: isMobile ? "60px 20px" : "clamp(80px, 10vw, 140px) clamp(24px, 6vw, 100px)",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 56, maxWidth: 620 }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#ff2d55",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          A VIDEO PLATFORM DESIGNED FOR DISCOVERY
        </p>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900,
            letterSpacing: "-2px",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Everything you need to binge{" "}
          <span style={{ color: "#ff2d55" }}>smarter</span>
        </h2>
      </motion.div>

      <div
        className="features-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: 1,
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.06)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {FEATURES.map(({ icon, title, desc }, i) => (
          <motion.div
            key={title}
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * i }}
            style={{
              background: "#000",
              padding: "32px 28px",
              borderRadius: 0,
              transition: "all .25s",
              cursor: "default",
              border: "1px solid transparent",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255,45,85,.1)",
                border: "1px solid rgba(255,45,85,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
                color: "#ff2d55",
              }}
            >
              {icon}
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 800,
                marginBottom: 8,
                letterSpacing: "-.3px",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,.45)",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   CTA BANNER
══════════════════════════════════════ */
function CtaBanner({ onLogin, isMobile }: { onLogin: () => void; isMobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section
      ref={ref}
      style={{ padding: "0 clamp(24px, 6vw, 100px) clamp(80px, 10vw, 140px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="cta-banner-inner"
        style={{
          background: "#ff2d55",
          borderRadius: 24,
          padding: isMobile ? "40px 24px" : "clamp(40px, 6vw, 72px) clamp(28px, 5vw, 72px)",
          display: "flex",
          flexWrap: "wrap",
          gap: isMobile ? 32 : 24,
          alignItems: "center",
          justifyContent: isMobile ? "center" : "space-between",
          textAlign: isMobile ? "center" : "left",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* bg deco */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,.08)",
            pointerEvents: "none",
          }}
        />
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              opacity: 0.7,
              letterSpacing: "1px",
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}
          >
            No credit card required
          </p>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(28px, 4.5vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Ready to discover
            <br />
            your next obsession?
          </h2>
        </div>
        <button
          onClick={onLogin}
          id="banner-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "clamp(14px, 2vw, 18px) clamp(28px, 3vw, 44px)",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 800,
            background: "#fff",
            color: "#ff2d55",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,.3)",
            flexShrink: 0,
            transition: "transform .2s",
          }}
        >
          Start for Free <ArrowRight size={18} />
        </button>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════
   BRAND FOOTER WITH GLITCH
══════════════════════════════════════ */
function BrandFooter({ onLogin, isMobile }: { onLogin: () => void; isMobile: boolean }) {
  return (
    <footer
      style={{
        background: "#000",
        borderTop: "1px solid rgba(255,255,255,.06)",
        overflow: "hidden",
      }}
    >
      {/* Top footer row */}
      <div
        className="footer-top"
        style={{
          display: "flex",
          justifyContent: isMobile ? "center" : "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          flexDirection: isMobile ? "column" : "row",
          gap: 24,
          padding: isMobile ? "40px 20px" : "clamp(24px, 4vw, 40px) clamp(24px, 6vw, 100px)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AppIcon size={30} />
          <span
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            Reddit Reel <span style={{ color: "#ff2d55" }}>AI</span>
          </span>
        </div>
        <div className="footer-links" style={{ display: "flex", gap: 20 }}>
          {["Start Scrolling", "Top Picks", "Your Vibes"].map((l) => (
            <button
              key={l}
              onClick={onLogin}
              style={{
                color: "rgba(255,255,255,.3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Massive glitch brand name */}
      <div
        style={{
          position: "relative",
          padding: "20px 0 0",
          overflow: "hidden",
          lineHeight: 0.85,
        }}
      >
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(80px, 18vw, 240px)",
            fontWeight: 900,
            letterSpacing: "-6px",
            color: "#fff",
            userSelect: "none",
            paddingLeft: "clamp(20px, 4vw, 60px)",
            lineHeight: 0.9,
          }}
          className="footer-brand-text"
        >
          <GlitchText>ReelAI</GlitchText>
        </div>
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,.2)",
            padding:
              "clamp(16px, 2vw, 24px) clamp(20px, 4vw, 60px) clamp(20px, 4vw, 40px)",
            margin: 0,
          }}
        >
          © 2026 Reddit ReelAI — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
