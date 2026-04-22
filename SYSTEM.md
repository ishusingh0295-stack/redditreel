# 🔧 System Documentation

## 📋 Table of Contents

- [Project Information](#-project-information)
- [System Requirements](#-system-requirements)
- [Technology Stack](#-technology-stack)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Authentication Flow](#-authentication-flow)
- [Build Configuration](#-build-configuration)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 📦 Project Information

| Property | Value |
|----------|-------|
| **Name** | Reddit Reel AI |
| **Version** | 1.0.0 |
| **License** | MIT |
| **Repository** | [github.com/tarunkumar-sys/next_llm](https://github.com/tarunkumar-sys/next_llm) |
| **Node Version** | 18+ |
| **Package Manager** | npm |

---

## 💻 System Requirements

### Minimum Requirements

```yaml
Node.js: >= 18.0.0
npm: >= 9.0.0
RAM: 2GB minimum
Disk Space: 500MB
OS: Windows, macOS, Linux
```

### Recommended Requirements

```yaml
Node.js: >= 20.0.0
npm: >= 10.0.0
RAM: 4GB or more
Disk Space: 1GB
OS: Latest stable version
```

### External Services Required

```yaml
PostgreSQL: 14+  (Neon, Supabase, Railway, or self-hosted)
Ollama: Latest   (optional — for AI query interpretation)
```

---

## 🛠️ Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Node.js** | 18+ | Runtime environment |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **HLS.js** | Latest | HLS video streaming with buffer tuning |
| **next-pwa** | Latest | Service worker + offline reel cache |
| **Framer Motion** | 12.38.0 | Animation library |
| **Lucide React** | 0.563.0 | Icon library |
| **Lenis** | 1.3.20 | Smooth scroll |
| **Tailwind CSS** | 4.x | Utility-first CSS |

### Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Prisma** | 5.22.0 | ORM |
| **PostgreSQL** | 14+ | Only supported database |
| **Auth.js** | 5.0.0-beta.30 | Authentication |
| **bcryptjs** | 3.0.3 | Password hashing |

### AI & APIs

| Technology | Version | Purpose |
|------------|---------|---------|
| **Ollama** | Latest | Local LLM integration |
| **Reddit API** | v1 | Content fetching via OAuth |
| **HLS Streaming** | — | Video playback via HLS.js |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **tsx** | 4.21.0 | TypeScript execution |
| **Vercel Analytics** | 2.0.1 | Analytics tracking |

---

## 🔐 Environment Variables

### Required Variables

```env
# Authentication (REQUIRED)
AUTH_SECRET=                    # Generate: npx auth secret
DATABASE_URL=                   # PostgreSQL connection string

# Production URLs
NEXTAUTH_URL=http://localhost:3000   # Local dev only; Vercel auto-detects
AUTH_TRUST_HOST=true                 # Required for production proxies
```

### Optional Variables

```env
# Reddit API (optional — improves rate limits)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# AI Features (optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Admin Seed (optional)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_NAME=Admin

NEXT_TELEMETRY_DISABLED=1
```

### Database URL (PostgreSQL only)

```env
# Neon / Supabase / Railway / self-hosted
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

> ⚠️ SQLite is **not supported**. The Prisma schema uses `provider = "postgresql"`.

---

## 🗄️ Database Schema

### Models Overview

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | User accounts | id, email, password, role |
| **Session** | Auth sessions | sessionToken, userId, expires |
| **Account** | OAuth accounts | provider, providerAccountId |
| **Board** | Reel collections | name, userId |
| **SavedReel** | Saved reels | id (Reddit post ID), title, videoUrl |
| **Note** | User notes | text, userId |
| **SearchQuery** | Analytics | query, hits |
| **UserActivity** | Feed personalization | type, payload, userId |

### User Roles

```typescript
// role field on User model
"USER"   // Default — access to /dashboard
"ADMIN"  // Full access including /admin
```

### First User Rule
The first registered user is automatically promoted to `ADMIN`.

### Relationships

```
User (1) ──── (N) Board
User (1) ──── (N) SavedReel
User (1) ──── (N) Note
User (1) ──── (N) UserActivity
User (1) ──── (N) Session
User (1) ──── (N) Account
Board (1) ──── (N) SavedReel
```

---

## 🌐 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page |
| POST | `/api/auth/signin` | User login |
| POST | `/api/auth/signup` | User registration |

### Protected Endpoints (Requires Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | User dashboard with reel feed |
| GET | `/api/reddit` | Fetch & rank Reddit reels |
| POST | `/api/reddit` | Track watch event (personalization) |
| POST | `/api/interpret` | AI query interpretation (Ollama) |

### Admin Endpoints (Requires ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin` | Admin dashboard |
| GET | `/admin/user/[id]` | User details |
| GET | `/api/admin/export/users` | Export user data |

### API Response Format

**Success:**
```json
{ "success": true, "reels": [...], "pagination": { "subs": "..." } }
```

**Error:**
```json
{ "success": false, "error": "message" }
```

---

## 🔒 Authentication Flow

### Registration

```
1. User submits name/email/password
2. Format validation (regex)
3. Duplicate email + name check (case-insensitive)
4. bcrypt hash (10 rounds)
5. User created — first user gets ADMIN role
6. JWT session issued via Auth.js
```

### Login

```
1. User submits credentials
2. Email lookup
3. bcrypt verify
4. JWT session issued
5. Role-based redirect:
   ADMIN → /admin
   USER  → /dashboard (or callbackUrl)
```

### Session Management

```yaml
Token Type: JWT
Storage: HttpOnly secure cookies
Expiration: 30 days
CSRF: Handled by Auth.js
```

### Route Protection

```typescript
// proxy.ts (Next.js middleware)
- Checks Auth.js session on every request
- /dashboard, /admin → redirect to /?auth=1 if unauthenticated
- /admin → returns 403 if role !== ADMIN
```

---

## ⚙️ Build Configuration

### Next.js Config (`next.config.ts`)

Key settings:
- `reactStrictMode: true`
- `poweredByHeader: false`
- `compress: true`
- Image remote patterns for Reddit, Imgur, redd.it, gfycat
- Security headers on all routes and API routes
- **next-pwa** enabled in production (disabled in dev to preserve HMR)

### PWA / Service Worker (`public/sw.js`)

| Cache | Strategy | Limit |
|-------|----------|-------|
| App shell (`/_next/static/`) | CacheFirst | Long TTL |
| `/api/reddit` | NetworkFirst | Falls back to cached JSON |
| Media (v.redd.it, imgur, etc.) | CacheFirst + LRU eviction | **10 reels max** |

### Build Scripts

```json
{
  "dev":   "next dev",
  "build": "next build",
  "start": "next start",
  "lint":  "next lint",
  "seed":  "tsx prisma/seed.ts"
}
```

### Virtual Reel Window (ReelFeed)

- DOM always holds exactly **3 video slots** (prev / current / next)
- Swipe = CSS `translateY` only — no unmount, no network fetch, no HLS reinit
- HLS buffer: active slot `maxBufferLength: 30s`, preload slots `8s`
- Background feed prefetch via `startTransition` when user reaches reel N−2 from end

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import at vercel.com → add env vars → Deploy

# 3. After first deploy — run DB migration
vercel env pull
npx prisma db push
```

**Environment Variables (Vercel):**
```env
AUTH_SECRET=your-secret
DATABASE_URL=postgresql://...
AUTH_TRUST_HOST=true
REDDIT_CLIENT_ID=your-id
REDDIT_CLIENT_SECRET=your-secret
OLLAMA_URL=http://your-ollama-server:11434
NEXT_TELEMETRY_DISABLED=1
```

> Vercel auto-detects `NEXTAUTH_URL` — do **not** set it manually on Vercel.

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t reddit-reel-ai .
docker run -p 3000:3000 --env-file .env reddit-reel-ai
```

### Database Migration

```bash
npx prisma generate       # Generate Prisma Client
npx prisma db push        # Push schema to PostgreSQL
npx prisma migrate deploy # Run pending migrations
npm run seed              # Optional: seed admin user
```

---

## 🐛 Troubleshooting

### Build Failures

**`Could not find declaration file for module 'next-pwa'`**
```bash
# Already handled by next-pwa.d.ts shim in project root.
# Ensure tsconfig.json includes "." in typeRoots or leave as-is.
```

### Database Connection

**`P1001: Can't reach database server`**
```bash
# Check DATABASE_URL in .env
# PostgreSQL only — no SQLite fallback
# Verify SSL mode: ?sslmode=require for Neon/Supabase
```

### Authentication

**Session not persisting:**
```bash
# Set AUTH_SECRET (required)
# Local dev: NEXTAUTH_URL=http://localhost:3000
# Production: do NOT set NEXTAUTH_URL on Vercel (auto-detected)
# Set AUTH_TRUST_HOST=true in production
```

### Ollama / AI

**AI features not responding:**
```bash
ollama serve                         # Start Ollama
ollama pull llama3.2                 # Pull model
curl http://localhost:11434/api/tags # Verify running
```

### Performance

**Slow build:**
```bash
Remove-Item -Recurse -Force .next    # Clear Next.js cache (Windows)
npm run build
```

**Reel lag / buffering:**
- Virtual 3-slot window means no unmount on swipe — lag is a network issue
- Check HLS buffer settings in `attachHls()` in `ReelFeed.tsx`
- Active slot: `maxBufferLength: 30`, preload: `maxBufferLength: 8`

---

## 📊 System Monitoring

### Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| **Page Load** | < 2s | Vercel Analytics |
| **API Response** | < 500ms | Server logs |
| **Database Query** | < 100ms | Prisma logs |
| **Reel Swipe** | 0ms lag | CSS transform only |

### Database Maintenance

```bash
# Backup (PostgreSQL)
pg_dump $DATABASE_URL > backup.sql

# Reset (development only)
npx prisma migrate reset

# Browse data
npx prisma studio
```

### Security Updates

```bash
npm audit
npm audit fix
```

---

## 📞 Support & Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Auth.js Docs](https://authjs.dev)
- [HLS.js Docs](https://github.com/video-dev/hls.js)
- [next-pwa Docs](https://github.com/shadowwalker/next-pwa)
- [Reddit API Docs](https://www.reddit.com/dev/api)
- [GitHub Issues](https://github.com/tarunkumar-sys/next_llm/issues)

---

<div align="center">

**Last Updated:** April 2026

**Maintained by:** [Tarun Kumar](https://github.com/tarunkumar-sys)

</div>
