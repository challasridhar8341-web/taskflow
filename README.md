# TaskFlow — Setup Guide
**Next.js 14 + Supabase · Local Dev**

---

## ⏱ Total time: ~15 minutes

---

## Step 1 — Install Node.js (if not already)
Download from https://nodejs.org (LTS version)

---

## Step 2 — Create Supabase project (free)

1. Go to https://supabase.com → Sign up (free)
2. Click **"New Project"**
3. Choose a name (e.g. `taskflow`), set a DB password, pick a region
4. Wait ~2 minutes for it to spin up

---

## Step 3 — Run the database schema

1. In Supabase → left sidebar → **SQL Editor**
2. Click **New Query**
3. Open `supabase-schema.sql` from this folder
4. Copy everything → Paste → Click **Run**
5. You should see "Success. No rows returned"

---

## Step 4 — Get your API keys

1. Supabase → left sidebar → **Settings → API**
2. Copy **Project URL** → paste into `.env.local`
3. Copy **anon public** key → paste into `.env.local`

Create a file called `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Step 5 — Install dependencies & run

Open terminal in the project folder:

```bash
npm install
npm run dev
```

Open http://localhost:3000 → you'll be redirected to login.

---

## Step 6 — Create your first user

1. Click **Sign up** on the login page
2. Enter your name, email, password
3. You're in! 🎉

Invite teammates by having them sign up too — everyone can assign tasks to anyone.

---

## Features included

| Feature | Status |
|---|---|
| Email/password auth | ✅ |
| Create / assign tasks | ✅ |
| Priority + due dates | ✅ |
| Status tracking (todo→done) | ✅ |
| Overdue detection | ✅ |
| Activity log | ✅ |
| Team workload view | ✅ |
| Filter by status/owner | ✅ |
| Row-level security | ✅ |

---

## Deploy to Vercel later (optional)

```bash
npm install -g vercel
vercel
```
Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as environment variables in Vercel dashboard.
