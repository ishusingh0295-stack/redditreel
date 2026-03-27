# 🎬 Reddit Reel AI

<div align="center">

**AI-powered infinite scroll video feed from Reddit — like TikTok, but smarter.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![Auth.js](https://img.shields.io/badge/Auth.js-5-purple?style=flat-square)](https://authjs.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| | Feature | Description |
|--|---------|-------------|
| 🤖 | **AI Search** | Natural language queries via Ollama with rule-based fallback |
| 📱 | **Vertical Feed** | Full-screen scroll-snap UI (TikTok / Reels style) |
| 🎬 | **HLS Audio** | Reddit videos with full audio via HLS streaming |
| 🔐 | **Auth** | JWT sessions, bcrypt passwords, role-based access |
| 💾 | **Boards** | Save reels into custom boards with drag & drop |
| 📝 | **Notepad** | Take notes while browsing |
| 👨‍💼 | **Admin Panel** | User management, analytics, content moderation |
| 🔞 | **NSFW Toggle** | Age-gated adult content mode |
| ⚡ | **Preloading** | Next reel loads while you watch the current one |
| 🔒 | **Secure** | Security headers, API auth guards, console disabled in prod |

---

## 🏗️ Architecture

```
reddit-reel-ai/
├── app/
│   ├── _landing.tsx          # Landing page (client)
│   ├── page.tsx              # Root route — redirects authed users
│   ├── layout.tsx            # Root layout, admin seed, security init
│   ├── globals.css           # Design tokens + component styles
│   ├── admin/                # Admin dashboard (server, role-protected)
│   ├── dashboard/            # User dashboard (server + client split)
│   ├── actions/
│   │   ├── auth.ts           # register / login server actions
│   │   ├── db.ts             # boards, reels, notes CRUD
│   │   └── admin.ts          # admin-only actions
│   └── api/
│       ├── reddit/route.ts   # Reddit fetcher — OAuth + HLS media
│       └── interpret/route.ts# AI query interpreter (Ollama / rules)
├── components/
│   ├── ChatPanel.tsx         # AI search interface
│   ├── ReelFeed.tsx          # Infinite scroll video player
│   ├── Notepad.tsx           # Boards + notes manager
│   ├── LoginModal.tsx        # Portal-based auth modal
│   ├── SecurityInitializer.tsx # Client-side security bootstrap
│   └── ...
├── lib/
│   ├── security.ts           # Security utilities (Observer pattern)
│   └── useScrollLock.ts      # Ref-counted scroll lock hook
├── prisma/
│   ├── schema.prisma         # 10-model SQLite schema
│   └── migrations/           # Migration history
├── auth.ts                   # NextAuth config + Prisma singleton
└── middleware.ts             # Route guard + security headers
```

### 🔄 Request Flow

```
Browser
  │
  ├─ GET /          → page.tsx (server) → _landing.tsx (client)
  ├─ GET /dashboard → middleware auth check → _dashboard.tsx
  │
  ├─ POST /api/interpret  → Ollama LLM → rule-based fallback
  └─ GET  /api/reddit     → Reddit OAuth → media extraction → ReelPost[]
                                                    │
                                              Prisma → SQLite
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ — [nodejs.org](https://nodejs.org)
- **Ollama** (optional, for AI) — [ollama.com](https://ollama.com)

### 1 — Clone & install

```bash
git clone https://github.com/tarunkumar-sys/next_llm.git
cd next_llm
npm install
```

### 2 — Environment

Create `.env.local`:

```env
# Required
AUTH_SECRET=                  # npx auth secret
DATABASE_URL=file:./prisma/dev.db

# Optional — Reddit OAuth (improves rate limits)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# Optional — Local AI
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 3 — Database

```bash
npx prisma generate
npx prisma db push
```

### 4 — Run

```bash
npm run dev
# → http://localhost:3000
```

> 💡 The first user to register is automatically assigned the `ADMIN` role.

---

## 🧠 AI System

Two-tier query interpretation:

```
User query
    │
    ├─ 1. Ollama LLM (if running)
    │      └─ Extracts: category, keywords, sort, intent
    │
    └─ 2. Rule-based fallback (always available)
           └─ Regex category matching → subreddit pool selection
```

---

## 🔒 Security

| Layer | Mechanism |
|-------|-----------|
| **Routes** | Middleware redirects unauthenticated users to `/?auth=1` |
| **API** | `requireAuth()` guard on all API routes (401 if no session) |
| **Actions** | Every server action checks `session.user.id` |
| **Admin** | `checkAdmin()` throws if role ≠ `ADMIN` |
| **Headers** | `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` |
| **Browser** | Console + DevTools disabled in production |
| **Passwords** | bcrypt with 10 salt rounds |
| **Sessions** | JWT in HttpOnly secure cookies |

See [SECURITY.md](./SECURITY.md) for full details.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 19, Framer Motion, Lucide |
| Styling | CSS-in-JS + CSS custom properties |
| Database | SQLite via Prisma ORM |
| Auth | Auth.js v5 + bcryptjs |
| AI | Ollama (local LLM) |
| Scroll | Lenis smooth scroll |

---

## 📦 Scripts

```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint
npx prisma studio  # Database GUI
```

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel, Docker, and AWS guides.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
