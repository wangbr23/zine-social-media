# TODO

Current and near-term work. Mutable — edit freely, unlike the journal or decisions log.

Task format: `- [ ] \`T<n>\` <description> — <manual|agent>[, depends-on: T<a>, T<b>]`. IDs are sequential and never reused. A task is safe to hand to a parallel agent once every id in its `depends-on` is checked off. See the `plan-tasks` skill.

- [x] `T1` Run `/grill-me` on the core idea to settle scope and constraints — agent — see `docs/designs/zine-social-platform.md`
- [x] `T2` Pick the stack — agent — Next.js + Neon/Drizzle + Vercel Blob + Clerk, see `docs/decisions.md`
- [x] `T3` Scaffold the Next.js project (App Router) — agent — Next.js 16 + TypeScript + Tailwind CSS, npm
- [x] `T4` Provision Neon Postgres — manual, depends-on: T3 — connected through Vercel
- [x] `T5` Provision Vercel Blob — manual, depends-on: T3 — connected through Vercel
- [x] `T6` Provision Clerk — manual, depends-on: T3 — connected through Vercel
- [x] `T7` Design the data model (users, zines, pages, follows w/ pending state, likes, comments) and set up Drizzle schema + migrations — agent, depends-on: T4 — initial migration applied to Neon
- [x] `T8` Fill in AGENTS.md's Commands section (install/dev/test/lint/build) — agent, depends-on: T3
- [ ] `T23` Rotate the Neon database password — manual, URGENT — the connection string was accidentally exposed in an agent session transcript while diagnosing an unrelated `.env.local` formatting bug; reset it via Vercel/Neon dashboard and update `DATABASE_URL`/`DATABASE_URL_UNPOOLED` in `.env.local`
- [ ] `T9` Get Clerk + Vercel Blob environment variables from the Vercel dashboard (Project → Settings → Environment Variables) into `.env.local` — manual — T5/T6 are provisioned on Vercel but never pulled locally; no CLI needed, just copy the values. `.env.local` already has empty `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` / `BLOB_READ_WRITE_TOKEN` lines ready to fill in
- [ ] `T10` Install `@clerk/nextjs`, add `clerkMiddleware`, `<ClerkProvider>`, and sign-in/sign-up routes — agent, depends-on: T9
- [ ] `T11` Install `@vercel/blob`, add a token-based client upload route for page images — agent, depends-on: T9
- [ ] `T12` Sync a Clerk session to a `users` row — lazy upsert on first authenticated request (see note above re: webhook alternative) — agent, depends-on: T10
- [ ] `T13` Onboarding step for new users: choose a `handle`, confirm/edit `displayName` before they can do anything else — agent, depends-on: T12
- [ ] `T14` Zine creation flow — new draft `zines` row (title, aspect ratio, starter template or blank canvas) — agent, depends-on: T13
- [ ] `T15` Page editor UI — text/image/background blocks, writes `pages.blocks` jsonb — agent, depends-on: T14, T11
- [ ] `T16` Publish flow — lock a zine (`status: published`, set `publishedAt`, require ≥1 page) — agent, depends-on: T15
- [ ] `T17` Zine reader view — public page rendering a zine's pages, page navigation — agent, depends-on: T16
- [ ] `T18` Magazine profile page — own + public view, Zines/Drafts tabs, visibility toggle — agent, depends-on: T13
- [ ] `T19` Follow/unfollow, including the pending-approval flow for private magazines — agent, depends-on: T18
- [ ] `T20` Likes + comments on the reader view — agent, depends-on: T17
- [ ] `T21` Newsstand feed — chronological zines from followed users only — agent, depends-on: T19, T17
- [ ] `T22` App shell / bottom nav (Newsstand, Create, Profile) — agent, depends-on: T13
