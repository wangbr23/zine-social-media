# TODO

Current and near-term work. Mutable — edit freely, unlike the journal or decisions log.

Task format: `- [ ] \`T<n>\` <description> — <manual|agent>[, depends-on: T<a>, T<b>]`. IDs are sequential and never reused. A task is safe to hand to a parallel agent once every id in its `depends-on` is checked off. See the `plan-tasks` skill.

- [x] `T1` Run `/grill-me` on the core idea to settle scope and constraints — agent — see `docs/designs/zine-social-platform.md`
- [x] `T2` Pick the stack — agent — Next.js + Neon/Drizzle + Vercel Blob + Clerk, see `docs/decisions.md`
- [x] `T3` Scaffold the Next.js project (App Router) — agent — Next.js 16 + TypeScript + Tailwind CSS, npm
- [ ] `T4` Provision Neon Postgres via `vercel integration add` — agent, depends-on: T3
- [ ] `T5` Provision Vercel Blob via `vercel integration add` — agent, depends-on: T3
- [ ] `T6` Provision Clerk via `vercel integration add` — agent, depends-on: T3
- [ ] `T7` Design the data model (users/magazines, zines, pages, follows w/ pending state, likes, comments) and set up Drizzle schema + migrations — agent, depends-on: T4
- [ ] `T8` Fill in AGENTS.md's Commands section (install/dev/test/lint/build) — agent, depends-on: T3
