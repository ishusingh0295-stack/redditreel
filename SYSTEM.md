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

### Optional Dependencies

```yaml
Ollama: Latest version (for AI features)
Docker: Latest version (for containerization)
PostgreSQL: 14+ (for production database)
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
| **Framer Motion** | 12.38.0 | Animation library |
| **Lucide React** | 0.563.0 | Icon library |
| **Lenis** | 1.3.20 | Smooth scroll |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **CSS Modules** | Built-in | Scoped styling |

### Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Prisma** | 5.22.0 | ORM for database |
| **SQLite** | Default | Development database |
| **PostgreSQL** | 14+ | Production database |
| **Auth.js** | 5.0.0-beta.30 | Authentication |
| **bcryptjs** | 3.0.3 | Password hashing |

### AI & APIs

| Technology | Version | Purpose |
|------------|---------|---------|
| **Ollama** | Latest | Local LLM integration |
| **Reddit API** | v1 | Content fetching |
| **HLS Streaming** | - | Video playback |

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
DATABASE_URL=                   # Database connection string

# Production URLs (REQUIRED for deployment)
# For local development: http://localhost:3000
# For Vercel: Auto-detected (no need to set)
# For other platforms: https://your-domain.com
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true           # Trust proxy headers (required for production)
```

### Optional Variables

```env
# Reddit API (Optional - improves rate limits)
REDDIT_CLIENT_ID=              # Reddit app client ID
REDDIT_CLIENT_SECRET=          # Reddit app client secret

# AI Features (Optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Admin Seed (Optional)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_NAME=Admin

# Next.js Configuration
NEXT_TELEMETRY_DISABLED=1      # Disable telemetry
```

### Database URLs

**Development (SQLite):**
```env
DATABASE_URL="file:./prisma/dev.db"
```

**Production (PostgreSQL):**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

---

## 🗄️ Database Schema

### Models Overview

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | User accounts | id, email, password, role |
| **Session** | Auth sessions | sessionToken, userId, expires |
| **Account** | OAuth accounts | provider, providerAccountId |
| **Board** | Reel collections | name, userId, reels |
| **Reel** | Saved reels | url, title, subreddit |
| **Note** | User notes | content, userId |
| **UserActivity** | Activity tracking | type, payload, userId |

### User Roles

```typescript
enum Role {
  USER    // Default role for all users
  ADMIN   // Full system access
}
```

### Relationships

```
User (1) ──── (N) Board
User (1) ──── (N) Note
User (1) ──── (N) UserActivity
User (1) ──── (N) Session
User (1) ──── (N) Account
Board (1) ──── (N) Reel (many-to-many)
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
| GET | `/dashboard` | User dashboard |
| GET | `/api/reddit` | Fetch Reddit content |
| POST | `/api/interpret` | AI query interpretation |

### Admin Endpoints (Requires ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin` | Admin dashboard |
| GET | `/admin/user/[id]` | User details |
| GET | `/api/admin/export/users` | Export user data |

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🔒 Authentication Flow

### Registration Flow

```
1. User submits email/password
2. Server validates input
3. Password hashed with bcrypt (10 rounds)
4. User created in database
5. First user gets ADMIN role
6. Session created
7. JWT token issued
```

### Login Flow

```
1. User submits credentials
2. Server finds user by email
3. Password verified with bcrypt
4. Session created
5. JWT token issued
6. User redirected based on role:
   - ADMIN → /admin
   - USER → /dashboard (or callbackUrl)
```

### Session Management

```yaml
Token Type: JWT
Storage: HttpOnly secure cookies
Expiration: 30 days
Refresh: Automatic on activity
```

### Route Protection

```typescript
// Middleware (proxy.ts)
- Checks authentication status
- Validates user role
- Redirects unauthorized users to landing page with ?auth=1
- Preserves intended destination in callbackUrl
- Adds security headers

// Auth.js redirect callback
- Uses relative paths to avoid hardcoded URLs
- Respects baseUrl from environment
- Falls back to /dashboard for safety
```

---

## ⚙️ Build Configuration

### Next.js Config (`next.config.ts`)

```typescript
const nextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.redd.it" },
      { protocol: "https", hostname: "**.reddit.com" },
      // ... more patterns
    ],
    unoptimized: false,
  },
  async headers() {
    // Security headers configuration
  },
}
```

### Build Scripts

```json
{
  "dev": "next dev",                    // Development with Turbopack
  "build": "next build --no-turbo",     // Production build (stable)
  "start": "next start",                // Production server
  "lint": "eslint",                     // Code linting
  "seed": "tsx prisma/seed.ts"          // Database seeding
}
```

### Build Optimizations

- **React Strict Mode**: Enabled for development checks
- **Compression**: Enabled for smaller bundle sizes
- **Image Optimization**: Enabled with remote patterns
- **Turbopack**: Disabled for production builds (stability)
- **Telemetry**: Disabled for privacy

---

## 🚀 Deployment

### Vercel Deployment

**Prerequisites:**
```bash
- GitHub repository
- Vercel account
- Environment variables configured
```

**Steps:**
```bash
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy
```

**Environment Variables (Vercel):**
```env
AUTH_SECRET=your-secret
DATABASE_URL=postgresql://...
# NEXTAUTH_URL is auto-detected by Vercel - no need to set manually
AUTH_TRUST_HOST=true
REDDIT_CLIENT_ID=your-id
REDDIT_CLIENT_SECRET=your-secret
OLLAMA_URL=http://your-ollama-server:11434
NEXT_TELEMETRY_DISABLED=1
```

**Important Notes:**
- Vercel automatically sets `NEXTAUTH_URL` based on your deployment URL
- For custom domains, Vercel handles this automatically
- Never hardcode production URLs in your code - use relative paths
- The `trustHost: true` option in `auth.ts` allows Auth.js to work with proxies

### Docker Deployment

**Dockerfile:**
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

**Build & Run:**
```bash
docker build -t reddit-reel-ai .
docker run -p 3000:3000 --env-file .env reddit-reel-ai
```

### Database Migration (Production)

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Run migrations (if using migrate)
npx prisma migrate deploy

# Seed database (optional)
npm run seed
```

---

## 🐛 Troubleshooting

### Common Issues

#### Build Failures

**Issue:** React Compiler error
```
Error: Failed to resolve package babel-plugin-react-compiler
```

**Solution:**
```bash
# Ensure next.config.ts is minimal
# Remove any experimental.reactCompiler settings
# Use build script: "build": "next build --no-turbo"
```

#### Database Connection

**Issue:** Can't connect to database
```
Error: P1001: Can't reach database server
```

**Solution:**
```bash
# Check DATABASE_URL in .env
# Verify database is running
# Check network/firewall settings
# For PostgreSQL, ensure SSL mode is correct
```

#### Authentication Issues

**Issue:** Session not persisting
```
Error: No session found
```

**Solution:**
```bash
# Verify AUTH_SECRET is set
# For local dev: NEXTAUTH_URL=http://localhost:3000
# For Vercel: NEXTAUTH_URL is auto-detected (don't set it)
# For other platforms: Set NEXTAUTH_URL to your domain
# Ensure AUTH_TRUST_HOST=true in production
# Ensure trustHost: true in auth.ts config
# Clear browser cookies and try again
```

**Issue:** Redirecting to wrong URL after login
```
Error: Redirects to old deployment URL
```

**Solution:**
```bash
# Check .env and .env.local files for hardcoded URLs
# Remove any old NEXTAUTH_URL values
# For local dev: NEXTAUTH_URL=http://localhost:3000
# For production: Let platform auto-detect or set to current domain
# Verify auth.ts has redirect callback with relative paths
# Clear browser cache and cookies
```

#### Ollama Connection

**Issue:** AI features not working
```
Error: Failed to connect to Ollama
```

**Solution:**
```bash
# Verify Ollama is running: ollama serve
# Check OLLAMA_URL is correct
# Ensure model is pulled: ollama pull llama3.2
# Test connection: curl http://localhost:11434/api/tags
```

### Performance Issues

**Slow Build Times:**
```bash
# Use --no-turbo flag
npm run build

# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Slow Runtime:**
```bash
# Enable production mode
NODE_ENV=production npm start

# Check database indexes
npx prisma studio

# Monitor with Vercel Analytics
```

### Debug Mode

**Enable verbose logging:**
```bash
# Development
DEBUG=* npm run dev

# Build
npm run build -- --debug

# Prisma
DEBUG="prisma:*" npm run dev
```

---

## 📊 System Monitoring

### Health Checks

```typescript
// API health endpoint
GET /api/health

Response:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Performance Metrics

| Metric | Target | Tool |
|--------|--------|------|
| **Page Load** | < 2s | Vercel Analytics |
| **API Response** | < 500ms | Server logs |
| **Database Query** | < 100ms | Prisma logs |
| **Build Time** | < 5min | CI/CD logs |

### Logging

```typescript
// Server-side logging
console.log('[INFO]', message)
console.error('[ERROR]', error)

// Client-side (disabled in production)
// See lib/security.ts
```

---

## 🔄 Update & Maintenance

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm install package@latest

# Update Next.js
npm install next@latest react@latest react-dom@latest
```

### Database Maintenance

```bash
# Backup database (SQLite)
cp prisma/dev.db prisma/backup.db

# Backup database (PostgreSQL)
pg_dump DATABASE_URL > backup.sql

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

### Security Updates

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (use with caution)
npm audit fix --force
```

---

## 📞 Support & Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Auth.js Docs](https://authjs.dev)
- [Reddit API Docs](https://www.reddit.com/dev/api)

### Community

- [GitHub Issues](https://github.com/tarunkumar-sys/next_llm/issues)
- [GitHub Discussions](https://github.com/tarunkumar-sys/next_llm/discussions)

### Contact

- **Email**: your-email@example.com
- **GitHub**: [@tarunkumar-sys](https://github.com/tarunkumar-sys)

---

<div align="center">

**Last Updated:** 2024

**Maintained by:** [Tarun Kumar](https://github.com/tarunkumar-sys)

</div>
