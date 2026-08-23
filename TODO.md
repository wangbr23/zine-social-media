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
- [x] `T15` Page editor UI — text/image/background blocks, writes `pages.blocks` jsonb — agent, depends-on: T14, T11
- [ ] `T16` Publish flow — lock a zine (`status: published`, set `publishedAt`, require ≥1 page) — agent, depends-on: T15
- [ ] `T17` Zine reader view — public page rendering a zine's pages, page navigation — agent, depends-on: T16
- [x] `T18` Magazine profile page — own + public view, Zines/Drafts tabs, visibility toggle — agent, depends-on: T13
- [x] `T19` Follow/unfollow, including the pending-approval flow for private magazines — agent, depends-on: T18
- [ ] `T20` Likes + comments on the reader view — agent, depends-on: T17
- [ ] `T21` Newsstand feed — chronological zines from followed users only — agent, depends-on: T19, T17
- [x] `T22` App shell / bottom nav (Newsstand, Create, Profile) — agent, depends-on: T13

## Creation experience overhaul (see `docs/designs/creation-desk-review.md` note below)

Grew out of a three-agent review (implementation audit, competitor research, ideas brainstorm) of `src/app/create/[zineId]/`. Full synthesis was delivered as an artifact, not saved to disk verbatim — see `docs/decisions.md`'s 2026-08-23 entries for the two scope calls it prompted (shape/sticker block type, desktop-first editor). Stretch-tier ideas (remix, AI layout suggestions, real-time collab, print export) are explicitly deferred, not listed here.

- [ ] `T24` Decompose `zine-editor.tsx` into a shared `PageRenderer` plus separate canvas/inspector/toolbar/page-rail components — agent — prerequisite for everything below; the file currently mixes page state, block state, upload, persistence, and all rendering/editing UI
- [ ] `T25` Fix the block coordinate system to a fixed page-unit model (shared by renderer and server validator) instead of raw pixels against a variable-width canvas — agent, depends-on: T24
- [ ] `T26` Direct manipulation: drag, resize, and rotate blocks by pointer on the canvas, with the numeric fields kept as a precise fallback — agent, depends-on: T25
- [ ] `T27` Expose the block controls already stored but not editable today (text color, alignment, rotation) in the inspector, and relax the save validator to allow content to bleed off the page edge — agent, depends-on: T26
- [ ] `T28` Build real starter templates — each starting-point choice seeds page one with an actual layout, palette, and font pairing instead of just a header label — agent, depends-on: T25
- [ ] `T29` Per-zine palette system — a swatch strip seeded by the template or sampled from an uploaded photo, feeding every color picker in the editor — agent, depends-on: T27, T28
- [ ] `T30` Link the draft zine cards on the profile page into the editor (they're currently unclickable dead ends) — agent
- [ ] `T31` Add an unsaved-changes warning before the editor's exit action discards edits — agent, depends-on: T24
- [ ] `T32` Sticker/shape tray: a curated `ShapeBlock` type (torn-paper strip, tape, speech bubble, starburst), colorable from the zine palette — agent, depends-on: T27, T29 — see `docs/decisions.md` 2026-08-23 "Reopen no stickers/shapes"
- [ ] `T33` Image treatments: frame/mask presets (polaroid, torn-edge, circle) and non-destructive filters (duotone, xerox, riso) tied to the zine palette — agent, depends-on: T29, T32
- [ ] `T34` Auto-arrange: a "shuffle this page" composition generator over a page's images (scattered mood-board, editorial grid, hero-plus-three) — agent, depends-on: T28, T29
- [ ] `T35` Layers panel: bring-forward/send-back controls and a visible stack, using the existing block-array order as z-order — agent, depends-on: T27
- [ ] `T36` Page-turn transitions for the reader view — agent, depends-on: T17 — differentiating-tier, but genuinely blocked on the reader view existing first
