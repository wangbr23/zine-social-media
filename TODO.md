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
- [x] `T23` Rotate the Neon database password — manual — done
- [x] `T9` Get Clerk + Vercel Blob environment variables from the Vercel dashboard into `.env.local` — manual — done, all 5 keys verified present
- [x] `T10` Install `@clerk/nextjs`, add `clerkMiddleware`, `<ClerkProvider>`, and sign-in/sign-up routes — agent, depends-on: T9 — implemented with Next.js 16 `src/proxy.ts`
- [x] `T11` Install `@vercel/blob`, add a token-based client upload route for page images — agent, depends-on: T9 — authenticated, user-scoped image upload tokens
- [x] `T12` Resolve the Clerk session to an existing `users` row; authenticated users without one must be sent to onboarding — agent, depends-on: T10
- [x] `T13` Onboarding for new Clerk users: choose a unique `handle`, confirm/edit `displayName`, and atomically create the complete `users` row — agent, depends-on: T12
- [x] `T14` Zine creation flow — new draft `zines` row (title, aspect ratio, starter template or blank canvas) — agent, depends-on: T13
- [ ] `T15` Page editor UI — text/image/background blocks, writes `pages.blocks` jsonb — agent, depends-on: T14, T11
- [ ] `T16` Publish flow — lock a zine (`status: published`, set `publishedAt`, require ≥1 page) — agent, depends-on: T15
- [ ] `T17` Zine reader view — public page rendering a zine's pages, page navigation — agent, depends-on: T16
- [x] `T18` Magazine profile page — own + public view, Zines/Drafts tabs, visibility toggle — agent, depends-on: T13
- [ ] `T19` Follow/unfollow, including the pending-approval flow for private magazines — agent, depends-on: T18
- [ ] `T20` Likes + comments on the reader view — agent, depends-on: T17
- [ ] `T21` Newsstand feed — chronological zines from followed users only — agent, depends-on: T19, T17
- [x] `T22` App shell / bottom nav (Newsstand, Create, Profile) — agent, depends-on: T13
