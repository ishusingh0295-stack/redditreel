<div align="center">

# 🎬 Reddit Reel AI

### AI-Powered TikTok-Style Video Feed from Reddit

Transform Reddit into an infinite scroll video experience with intelligent AI search

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#-features) • [Screenshots](#-screenshots) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack)

</div>

---

## 📸 Screenshots

<div align="center">

### 🏠 Landing Page
![Landing Page](public/demo_img/home.png)

### 🔐 Authentication
![Authentication](public/demo_img/auth.png)

### 📱 Dashboard
![Dashboard](public/demo_img/dashboard.png)

### 👨‍💼 Admin Panel
![Admin Panel](public/demo_img/admin.png)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 **Smart AI Search**
Natural language queries powered by Ollama LLM with intelligent rule-based fallback

### 📱 **Zero-Lag Reel Feed**
Virtual 3-slot DOM window — swipe changes only CSS `translateY`. No unmount, no refetch, no rebuffer.

### 🎬 **HLS.js Streaming**
Full Reddit video playback with tuned buffer lengths: 30s active, 8s preload

### 💾 **Notepad & Boards**
Save and organize favorite reels with tags and collections

</td>
<td width="50%">

### 🔐 **Secure Auth**
JWT sessions with bcrypt encryption and role-based access control

### 📶 **Offline-Ready PWA**
Service worker caches last 10 viewed reels — instant load on slow or no connection

### 🔞 **NSFW Mode**
Age-gated adult content with 500+ subreddit coverage

### 👨‍💼 **Admin Dashboard**
User management, analytics, and content moderation

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+  |  npm  |  PostgreSQL 14+  |  Ollama (optional)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/tarunkumar-sys/next_llm.git
cd next_llm

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database (PostgreSQL required)
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## ⚙️ Configuration

Create `.env.local` in the root directory:

```env
# Authentication (Required)
AUTH_SECRET=your-secret-key-here    # Generate: npx auth secret
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Reddit API (Optional - improves rate limits)
REDDIT_CLIENT_ID=your-client-id
REDDIT_CLIENT_SECRET=your-client-secret

# AI Features (Optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

<details>
<summary><b>🔑 Getting Reddit API Credentials</b></summary>

1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Select "web app"
4. Set redirect URI to `http://localhost:3000`
5. Copy your client ID and secret

</details>

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![HLS.js](https://img.shields.io/badge/HLS.js-FF6B35?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

### Authentication & Security
![Auth.js](https://img.shields.io/badge/Auth.js-purple?style=for-the-badge)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-338?style=for-the-badge)

### AI & APIs
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge)
![Reddit API](https://img.shields.io/badge/Reddit_API-FF4500?style=for-the-badge&logo=reddit&logoColor=white)

</div>

---

## 📁 Project Structure

```
reddit-reel-ai/
├── app/
│   ├── api/
│   │   ├── reddit/       # Reddit content fetcher + personalization
│   │   └── interpret/    # AI query interpreter (Ollama)
│   ├── actions/
│   │   ├── auth.ts       # Register / login server actions
│   │   ├── db.ts         # SavedReel / Note / Board CRUD
│   │   └── admin.ts      # Admin operations
│   ├── admin/            # Admin dashboard
│   ├── dashboard/        # User dashboard
│   └── _landing.tsx      # Landing page
├── components/
│   ├── ReelFeed.tsx      # Virtual 3-slot reel window + HLS.js
│   ├── ChatPanel.tsx     # AI search interface
│   ├── Notepad.tsx       # Saved reels manager
│   ├── LoginModal.tsx    # Auth modal
│   └── ...
├── lib/
│   ├── feedEngine.ts     # Weighted round-robin feed algorithm
│   └── ...
├── prisma/
│   ├── schema.prisma     # PostgreSQL schema
│   └── migrations/
├── public/
│   ├── sw.js             # Service worker (10-reel LRU cache)
│   ├── manifest.json     # PWA manifest
│   └── demo_img/
├── next.config.ts        # next-pwa + security headers
└── next-pwa.d.ts         # Type shim for next-pwa
```

---

## 🎯 Key Features Explained

### 📺 Virtual Reel Window
Only 3 `<video>` elements ever exist in the DOM. On swipe, only CSS `translateY` changes — no component unmount, no network request, no HLS.js reinit. Zero-lag swipe at any speed.

### 🎥 HLS.js with Smart Buffering
- **Active slot**: `maxBufferLength: 30s`, `maxMaxBufferLength: 60s`
- **Preload slots**: `maxBufferLength: 8s`
- HLS instance reused across swipes — destroyed only when the URL changes

### 🤖 AI-Powered Feed
Query in natural language: *"Show me funny cat videos"* → Ollama interprets → fetches from 2000+ subreddits

**Two-tier system:**
1. **Ollama LLM** — Advanced natural language understanding
2. **Rule-based fallback** — Always available, regex-based matching

### 📊 Intelligent Feed Algorithm
- **Weighted round-robin** for subreddit variety
- **Personalization** weights from watch history (last 200 events)
- `startTransition` background prefetch when user is 5 reels from end

### 📶 Offline PWA
Service worker at `/sw.js` caches:
- App shell (JS/CSS/fonts) — CacheFirst, long TTL
- Last **10 viewed reels** media — LRU eviction, instant revisit
- `/api/reddit` JSON — NetworkFirst with stale fallback

---

## 🛡️ Security Features

- 🔒 **JWT Authentication** with HttpOnly cookies
- 🔐 **bcrypt Password Hashing** (10 rounds)
- 🛡️ **HTTP Security Headers** (X-Frame-Options, nosniff, XSS-Protection)
- 👮 **Role-Based Access Control** (USER / ADMIN)
- 🚫 **API Route Protection** with server-side auth guards
- 🔍 **Input Validation** on all server actions
- 📝 **Row-level data isolation** via `userId` filtering
- ✅ **All security is server-side** — no client-side DevTools blocking

---

## 📜 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed admin user
npx prisma studio    # Open database GUI
npx prisma db push   # Push schema to PostgreSQL
npx prisma generate  # Regenerate Prisma Client
```

---

## 🚀 Deployment

<details>
<summary><b>Deploy to Vercel</b></summary>

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables (see SYSTEM.md)
4. Deploy — Vercel auto-detects `NEXTAUTH_URL`, do NOT set it manually

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

</details>

<details>
<summary><b>Docker Deployment</b></summary>

```bash
# Build image
docker build -t reddit-reel-ai .

# Run container
docker run -p 3000:3000 --env-file .env reddit-reel-ai
```

</details>

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Reddit API** for content delivery
- **Ollama** for local AI capabilities
- **HLS.js** for robust video streaming
- **Next.js Team** for the amazing framework
- **Vercel** for hosting platform

---

<div align="center">

**Made with ❤️ by [Tarun Kumar](https://github.com/tarunkumar-sys)**

⭐ Star this repo if you find it useful!

[Report Bug](https://github.com/tarunkumar-sys/next_llm/issues) • [Request Feature](https://github.com/tarunkumar-sys/next_llm/issues) • [Documentation](SYSTEM.md)

</div>
