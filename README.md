# Finance PWA

Personal finance tracking for three entities (Etin Consult, Etin Media, Personal). Built with Next.js, Supabase, Tailwind, and shadcn/ui.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL editor.
3. Enable **Email** auth provider (magic link).
4. Add your site URL and `http://localhost:3000/auth/callback` to **Redirect URLs** in Authentication settings.

### 2. Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with magic link.

### 4. Deploy (Vercel)

1. Push to GitHub and import in Vercel.
2. Add the same env vars.
3. Add your production URL + `/auth/callback` to Supabase redirect URLs.

## Install on iPhone

1. Open the app in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the home screen for standalone, full-screen mode.

## Features

- Dashboard: balances, spend/income/net by period, runway
- Fast transaction entry with category chips
- Budget (planned purchases) vs actual
- Projection (planned income) vs budgeted spend
- Manual account balances and exchange rate
- Reports with charts
- Offline app shell (data requires network)
