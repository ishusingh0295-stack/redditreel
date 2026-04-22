# 🔒 Security

## Layers of Protection

### 1 — Route Guard (`proxy.ts`)
All `/dashboard` and `/admin` routes are protected by Next.js middleware. Unauthenticated requests are redirected to `/?auth=1` with the original destination preserved in `callbackUrl`.

```ts
const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
if (isProtected && !isLoggedIn) redirect('/?auth=1&callbackUrl=...');
```

### 2 — API Auth Guard
Every API endpoint requires a valid session:

```ts
async function requireAuth(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}
```

Protected endpoints:
- `GET /api/reddit`
- `POST /api/interpret`

### 3 — Server Action Guards
Every server action in `app/actions/db.ts` checks `session.user.id` before touching the database. Users can only read/write their own data (row-level isolation via `userId` filter).

### 4 — Admin Role Check
Admin-only operations throw immediately if the role is not `ADMIN`:

```ts
export async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') throw new Error('Forbidden');
  return session;
}
```

### 5 — HTTP Security Headers (`next.config.ts`)

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

### 6 — Password Security
- bcrypt with **10 salt rounds**
- Passwords never stored in plain text
- Passwords never returned from any query

### 7 — Session Security
- JWT strategy (stateless)
- Tokens stored in **HttpOnly secure cookies** (inaccessible to JavaScript)
- Auth.js handles CSRF protection on form submissions

> **Note:** All security enforcement is server-side. There is no client-side hardening (no DevTools blocking, no console suppression) — those approaches break accessibility tools and developer workflows without adding real security.

---

## Developer Guidelines

### ✅ Do

```ts
// Always check session in server actions
const session = await auth();
if (!session?.user?.id) return { error: 'Unauthorized' };

// Use Prisma (parameterized queries, no SQL injection)
const user = await prisma.user.findUnique({ where: { id } });

// Validate and bound inputs
const query = (raw as string)?.trim().slice(0, 500);
```

### ❌ Don't

```ts
// Never log sensitive data
console.log('token:', token);

// Never skip auth checks
const data = await fetchSensitiveData();

// Never store tokens in localStorage
localStorage.setItem('token', token);

// Never hardcode secrets
const secret = 'sk-1234';
```

---

## Reporting a Vulnerability

1. **Do not** open a public GitHub issue
2. Email the maintainer directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. Allow reasonable time for a fix before public disclosure

---

## Deployment Checklist

- [ ] `AUTH_SECRET` is a strong random value (`npx auth secret`)
- [ ] `DATABASE_URL` points to a persistent PostgreSQL instance (not `/tmp`)
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] Environment variables are set in the hosting platform, not committed to git
- [ ] `npm audit` passes with no critical vulnerabilities
- [ ] Admin account password changed from default after first deploy
