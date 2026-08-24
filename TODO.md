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
- [x] `T16` Publish flow — lock a zine (`status: published`, set `publishedAt`, require ≥1 page) — agent, depends-on: T15, T41 — done; publishing is an explicit irreversible editor action that atomically verifies ownership, draft status, and a saved page before locking the zine
- [x] `T17` Zine reader view — public page rendering a zine's pages, page navigation — agent, depends-on: T16 — done; published profile cards link to a read-only handle/slug route with ordered page rendering, button/keyboard navigation, and existing private-magazine access enforcement
- [x] `T18` Magazine profile page — own + public view, Zines/Drafts tabs, visibility toggle — agent, depends-on: T13
- [x] `T19` Follow/unfollow, including the pending-approval flow for private magazines — agent, depends-on: T18
- [ ] `T20` Likes + comments on the reader view — agent, depends-on: T17
- [ ] `T21` Newsstand feed — chronological zines from followed users only — agent, depends-on: T19, T17
- [x] `T22` App shell / bottom nav (Newsstand, Create, Profile) — agent, depends-on: T13

## Creation experience overhaul (see `docs/designs/creation-desk-review.md` note below)

Grew out of a three-agent review (implementation audit, competitor research, ideas brainstorm) of `src/app/create/[zineId]/`. Full synthesis was delivered as an artifact, not saved to disk verbatim — see `docs/decisions.md`'s 2026-08-23 entries for the two scope calls it prompted (shape/sticker block type, desktop-first editor). Stretch-tier ideas (remix, AI layout suggestions, real-time collab, print export) are explicitly deferred, not listed here.

- [x] `T24` Decompose `zine-editor.tsx` into a shared `PageRenderer` plus separate canvas/inspector/toolbar/page-rail components — agent — done; `PageRenderer` supports an interactive/static mode for future thumbnail and reader reuse
- [x] `T25` Fix the block coordinate system to a fixed page-unit model (shared by renderer and server validator) instead of raw pixels against a variable-width canvas — agent, depends-on: T24 — done; page is 1000 units wide, rendered via CSS container-query units (`cqw`)
- [x] `T26` Direct manipulation: drag, resize, and rotate blocks by pointer on the canvas, with the numeric fields kept as a precise fallback — agent, depends-on: T25 — done; plain pointer events, no new dependency, `src/app/create/[zineId]/block-transform.ts` holds the geometry
- [x] `T27` Expose the block controls already stored but not editable today (text color, alignment, rotation) in the inspector, and relax the save validator to allow content to bleed off the page edge — agent, depends-on: T26 — done; inspector and pointer transforms support controlled off-page bleed
- [x] `T28` Build real starter templates — each starting-point choice seeds page one with an actual layout, palette, and font pairing instead of just a header label — agent, depends-on: T25 — done; `dispatch`/`photo-essay` seed real text+background, image blocks deliberately left to the user since a placeholder URL can't pass validation
- [x] `T29` Per-zine palette system — a swatch strip seeded by the template or sampled from an uploaded photo, feeding every color picker in the editor — agent, depends-on: T27, T28 — done; persisted on each zine, seeded by its template, refreshed from uploaded photos, and available beside background and text color controls
- [x] `T30` Link the draft zine cards on the profile page into the editor (they're currently unclickable dead ends) — agent — done; published cards left as-is
- [x] `T31` Add an unsaved-changes warning before the editor's exit action discards edits — agent, depends-on: T24 — done; tracks dirty state per-page since edits survive a page switch, plus a `beforeunload` guard
- [x] `T32` Sticker/shape tray: a curated `ShapeBlock` type (torn-paper strip, tape, speech bubble, starburst), colorable from the zine palette — agent, depends-on: T27, T29, T40 — done; all four shapes use the shared renderer, direct-manipulation/layer controls, server validation, and palette-aware inspector
- [ ] `T33` Image treatments: frame/mask presets (polaroid, torn-edge, circle) and non-destructive filters (duotone, xerox, riso) tied to the zine palette — agent, depends-on: T29, T32
- [x] `T34` Auto-arrange: a "shuffle this page" composition generator over a page's images (scattered mood-board, editorial grid, hero-plus-three) — agent, depends-on: T28, T29, T40 — done; each click cycles to a distinct image-only composition while preserving text, shapes, and layer order, and remains an unsaved page edit until explicitly saved
- [x] `T35` Layers panel: bring-forward/send-back controls and a visible stack, using the existing block-array order as z-order — agent, depends-on: T27 — done; stack is shown top-first, selecting a layer selects its canvas block, and adjacent reorder controls persist through the existing page save
- [ ] `T36` Page-turn transitions for the reader view — agent, depends-on: T17 — differentiating-tier, but genuinely blocked on the reader view existing first
- [x] `T37` Delete owned drafts from the profile and editor, with confirmation and published-zine protection — agent — done
- [x] `T45` Treat page one as the zine cover/title page: seed new drafts with their real title and render the authored first page on profile cards — agent — done; existing cover-image URLs remain a legacy fallback
- [x] `T46` Allow profile owners to permanently delete published zines with confirmation, ownership/status enforcement, and safe Blob cleanup — agent — done

## Code cleanup audit

Created from the 2026-08-23 whole-repository cleanup audit. Automated-test setup was deliberately excluded at the user's request.

- [x] `T38` Replace the editor's catch-all “supported image under 10 MB” upload error with accurate size/type/authorization/network failure states while keeping server details private — agent, depends-on: T40 — done; shared policy constants and typed client errors now distinguish validation, auth, availability, network, and upload failures
- [x] `T39` Add a safe Vercel Blob lifecycle for removed image blocks, deleted pages/drafts, and uploads abandoned before save; avoid deleting URLs still referenced elsewhere — agent, depends-on: T41 — done; post-response cleanup is owner-prefix constrained, globally reference-safe, failure-tolerant, and opportunistically sweeps abandoned uploads after a 24-hour grace period
- [x] `T40` Extract editor state and commands from `zine-editor.tsx` into focused hooks/modules without changing behavior, leaving the component as a coordinator — agent — done; editor state, mutations, uploads, navigation guards, and keyboard commands now live in `useZineEditor`
- [x] `T41` Fold draft ownership and `status: draft` checks into editor mutations to remove repeated authorization queries and close publish-versus-edit race windows — agent — done; page writes serialize through a conditional owned-draft update, and palette writes enforce the same predicate directly
- [x] `T42` Define one shared typed curated-font catalog used by block creation, the inspector, validation, and starter templates — agent — done; one browser-safe catalog now supplies the font union, options, default, and runtime guard
- [x] `T43` Remove avoidable non-null assertions and unsafe editor casts, and model the five-color zine palette more precisely at TypeScript boundaries — agent, depends-on: T38, T39, T40, T41, T42 — done; exact palette tuples, runtime-narrowed input, and type-safe block patches replace assertions
- [x] `T44` Replace Create Next App README/scaffolding, remove confirmed-unused public assets, fill AGENTS.md architecture/conventions, and reconcile the documented template count with implemented scope — agent — done; repository docs now describe actual setup and architecture, the v1 design names its two implemented starters, and unused starter SVGs are removed
