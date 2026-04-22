# Deployment Guide

This guide covers deploying Reddit Reel AI to production environments.

> ⚠️ **PostgreSQL required.** SQLite is not supported. Use [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app), or a self-hosted instance.

---

## 🚀 Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository

### 3. Configure Environment Variables

In Vercel dashboard → **Settings → Environment Variables**:

```env
AUTH_SECRET=your-generated-secret        # npx auth secret
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
AUTH_TRUST_HOST=true
REDDIT_CLIENT_ID=your-reddit-app-id
REDDIT_CLIENT_SECRET=your-reddit-app-secret
OLLAMA_URL=http://your-ollama-server:11434   # optional
NEXT_TELEMETRY_DISABLED=1
```

> **Do NOT set `NEXTAUTH_URL` on Vercel** — it is auto-detected from your deployment URL.

### 4. Deploy

Click **Deploy** and wait for the build to complete.

### 5. Database Setup

After first deployment:

```bash
vercel env pull        # Pull environment variables locally
npx prisma db push     # Push schema to PostgreSQL
npm run seed           # Optional: create admin user
```

---

## 🐳 Docker

### Dockerfile

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

### .dockerignore

```
node_modules
.next
.git
.env.local
.env
```

### Build & Run

```bash
docker build -t reddit-reel-ai .

docker run -p 3000:3000 \
  -e AUTH_SECRET=your-secret \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e AUTH_TRUST_HOST=true \
  reddit-reel-ai
```

---

## ☁️ AWS EC2 / VPS

### 1. Launch Instance

- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium or larger
- Security Group: Allow ports 80, 443, 3000

### 2. Setup

```bash
ssh -i your-key.pem ubuntu@your-instance-ip

sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

git clone https://github.com/tarunkumar-sys/next_llm.git
cd next_llm
npm install
```

### 3. Environment

```bash
nano .env.local
# Add all required env vars (see above)
```

### 4. Build & Run with PM2

```bash
npm run build
sudo npm install -g pm2
pm2 start npm --name "reddit-reel-ai" -- start
pm2 startup && pm2 save
```

### 5. Nginx Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

### 6. SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 Environment Variables Reference

### Required

```env
AUTH_SECRET=...          # Random secret for JWT signing
DATABASE_URL=...         # PostgreSQL connection string
AUTH_TRUST_HOST=true     # Required behind proxies / on non-Vercel hosts
```

### Optional

```env
NEXTAUTH_URL=http://localhost:3000   # Local dev only
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
NEXT_TELEMETRY_DISABLED=1
```

---

## 📊 Monitoring

### Vercel Analytics
Built-in — enabled via `@vercel/analytics` in layout.

### PM2

```bash
pm2 logs reddit-reel-ai    # Live logs
pm2 monit                  # Resource monitor
pm2 status                 # Process status
```

---

## 🔄 Continuous Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - name: Deploy to Vercel
        run: npx vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🚨 Troubleshooting

### Build Fails

```powershell
# Windows
Remove-Item -Recurse -Force .next, node_modules
npm install
npm run build
```

```bash
# macOS / Linux
rm -rf .next node_modules
npm install
npm run build
```

### Database Issues

```bash
# Check connection
npx prisma db push --preview-feature

# Reset (dev only)
npx prisma db push --force-reset

# Browse data
npx prisma studio
```

### Service Worker / PWA

The service worker (`public/sw.js`) is only registered in production (`NODE_ENV=production`). In development, HMR works normally without SW interference.

To clear a stale SW in the browser:
- DevTools → Application → Service Workers → Unregister

---

## 📋 Pre-Deployment Checklist

- [ ] `AUTH_SECRET` generated (`npx auth secret`)
- [ ] `DATABASE_URL` points to a live PostgreSQL instance
- [ ] `AUTH_TRUST_HOST=true` set for production
- [ ] `NEXTAUTH_URL` **not** set on Vercel (auto-detected)
- [ ] Reddit API credentials configured
- [ ] `npx prisma db push` run against production DB
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] `npm audit` — no critical vulnerabilities
- [ ] Admin password changed from default after first login

---

**Happy deploying! 🚀**
