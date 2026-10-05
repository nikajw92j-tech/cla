# Nexora Studio — website development agency platform

A full-stack platform where customers order websites, pick packages, subscribe to **Pro**, submit modification
requests, track projects live and talk to the team. It also includes a separate admin dashboard for running the business.

**Stack:** Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Prisma · framer-motion

## Quick start

```bash
npm install
cp .env.example .env        # then set DATABASE_URL (Postgres) and AUTH_SECRET (see below)
npm run setup               # creates the tables and seeds demo data
npm run dev                 # http://localhost:3000
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

| Account | Email | Password |
|---|---|---|
| Admin | `nikajw92j@gmail.com` | `Admin12345!` (from `.env`) |
| Demo customer (Pro, 3 of 5 credits left) | `demo@nexora.dev` | `Demo12345!` |

Seeded coupon codes: `WELCOME10` (10% off orders) and `PRO50` (50 ₾ off, Pro only).

Without SMTP settings, emails (verification, password reset, notifications) are **printed to the server console**,
so you can click the links during development.

## What's inside

| Area | Where |
|---|---|
| Public site: home, pricing, portfolio, Pro, free estimate, legal | `src/app/(marketing)` |
| Auth: sign up, login, logout, forgot/reset password, email verification | `src/app/(auth)`, `src/app/actions/auth.ts` |
| Customer dashboard | `src/app/dashboard` |
| 6-step order wizard with autosaved drafts, uploads and coupons | `src/app/dashboard/orders/new` |
| Modification requests, Pro credits and timeline | `src/app/dashboard/requests`, `src/app/actions/requests.ts` |
| Messaging, support tickets, notifications | `src/components/dashboard/chat.tsx`, `src/app/actions/messaging.ts` |
| Admin dashboard (analytics, CRUD, prices, translations…) | `src/app/admin`, `src/app/actions/admin.ts` |
| Data model | `prisma/schema.prisma` |
| Translations (ka / en / ru) | `src/lib/i18n/dictionaries` |
| Pricing, coupons and Pro credit logic | `src/lib/pricing.ts`, `src/lib/estimate.ts` |
| Payments (provider abstraction) | `src/lib/payments.ts` |

### Languages and currencies
- Every UI string lives in `src/lib/i18n/dictionaries/en.ts`. `ka.ts` and `ru.ts` are **type-checked** against it,
  so a missing translation fails the build.
- Admins can override any string at runtime (**Admin → Translations**) without a deploy.
- Language and currency are saved in cookies (and on the user's profile). Prices are stored in GEL and converted
  using exchange rates set in **Admin → Packages & Prices**. Converted amounts are labeled as approximate.

### Payments ⚠️
`src/lib/payments.ts` defines a `paymentProvider`. The bundled **test provider** sends customers to `/checkout/[id]`,
a clearly labeled test-mode page where they approve or decline the payment. **No real money moves.** Before going live:

1. Implement `createCheckout()` against your gateway (e.g. BOG, TBC Pay, Stripe) and return its hosted-checkout URL.
2. Point the gateway's webhook at `POST /api/payments/webhook` and set `PAYMENT_WEBHOOK_SECRET`.
   The handler verifies an HMAC-SHA256 signature and calls `confirmPayment()`, which is idempotent.
3. Remove the `/checkout/[id]` simulator.

Bank transfers create a pending payment with an invoice. An admin marks it paid in **Admin → Payments**.
Pro renewals are currently one paid 30-day period per checkout. Recurring billing needs your gateway's subscription API.

### Security
- Passwords use bcrypt (cost 12). Sessions are signed HS256 JWTs in `httpOnly`, `SameSite=Lax` cookies
  (30 days with "Stay logged in", otherwise 12 h). A `sessionVersion` field makes "log out everywhere"
  and password resets revoke every existing session.
- Middleware blocks unauthenticated access, and **every page and server action re-checks the session and record ownership**.
  Admin routes return 404 to non-admins.
- All input is validated server-side with zod. Rate limits cover login, registration, resets, messages, uploads and other actions.
- Uploads: extension allow-list, a magic-number check, a 10 MB limit, random file names, storage **outside** `/public`,
  served only by `/api/files/[id]` after an ownership check with `nosniff` and a sandbox CSP.
- Reset and verification tokens are single-use, expire, and are stored only as SHA-256 hashes.
- Security headers (HSTS, frame-deny, nosniff, referrer and permissions policies) are set in `next.config.ts`.

## Production deployment (Vercel)

1. **Database:** create a Postgres database (Neon, Supabase or Vercel → Storage → Postgres) and copy its connection string.
2. **Create the tables once**, from your machine, with `DATABASE_URL` in `.env` pointing at that database:
   `npx prisma db push` then `npm run db:seed`.
3. **Vercel → Project → Settings → Environment Variables:** `DATABASE_URL`, `AUTH_SECRET` (≥ 32 chars),
   `APP_URL` (your real domain), and optionally the SMTP settings. Change the admin password after the first login.
4. Import the GitHub repo in Vercel and deploy. The build command (`prisma generate && next build`) is already set.

Notes:
- **Uploads** are stored in the database (`FileBlob` table), so they work on serverless hosting with no extra setup.
  Vercel limits a request body to 4.5 MB, so a single upload request above that size is rejected there.
- **Rate limiting** is in-memory (per instance). With several instances, back `src/lib/rate-limit.ts` with Redis or Upstash.

## Scripts
`dev` · `build` · `start` · `typecheck` · `db:push` · `db:seed` · `db:reset` (destroys data) · `setup`
