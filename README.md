# TivoraHoldings

Premium investment platform built with Next.js 15, Supabase, and Tailwind CSS v4.

## Features

- **Landing page** — Hero, plans, features, testimonials, FAQ, animated ticker
- **Authentication** — Sign up (with referral), login, forgot password
- **User dashboard** — Overview with live chart, deposit, withdraw, transaction history, portfolio analytics, referrals, KYC verification, support chat, profile, settings
- **Admin panel** — Full CRUD: user management (credit balance, suspend), deposit/withdrawal approval, KYC review, messages, reports with charts
- **Real-time** — Live support chat and notifications via Supabase Realtime
- **Complete DB** — RLS policies, RPCs, triggers, storage buckets

## Quick Start

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Database Setup

1. Open your Supabase project → SQL Editor
2. Paste and run the entire contents of `scripts/database.sql`
3. That's it — all tables, RLS policies, RPCs, and storage buckets are created

## Make Yourself Admin

After signing up, run this in the Supabase SQL Editor:

```sql
UPDATE public.users SET is_admin = true WHERE email = 'your@email.com';
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | Your app domain (e.g. `localhost:3000`) |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Auth redirect override (optional) |

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **New Project** → import the repo.
3. Framework preset is auto-detected as **Next.js**. Leave build settings on their defaults.
4. Add the environment variables above under **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL once known, e.g. `https://tivoraholdings.vercel.app`)
5. Click **Deploy**.

### After the first deploy

In your Supabase project → **Authentication → URL Configuration**:

- **Site URL**: `https://<your-vercel-domain>`
- **Redirect URLs** — add:
  - `https://<your-vercel-domain>/auth/callback`
  - `https://<your-vercel-domain>/**` (broad fallback)
