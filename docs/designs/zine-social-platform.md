# Zine Social Platform — v1 Design

**Date:** 2026-08-22
**Status:** Resolved via `/grill-me` session — ready to build against.

A social platform for creating, publishing, and browsing zines: think Instagram, but the unit of content is a full page-based flipbook magazine instead of a single photo.

## Vocabulary

- **Magazine** — a creator's profile/account. One per user.
- **Zine** — a single published multi-page flipbook (an "issue"). The atomic unit that appears in a follower's feed — one Instagram-post-equivalent. A magazine can publish many zines over time.
- **Page** — one page inside a zine. Made of blocks (text, image, background).
- **Spread** — a two-page open-layout view of a zine (like a real magazine spread). Referenced in the mocks as a browsing unit; **not** in v1 scope (see Deferred).

## Product decisions

### Audience & access
- Built to scale to real outside users, not just a personal/portfolio project.
- **Open signup** — anyone can create an account and publish.
- **Profile visibility**: a magazine can be set **public** or **private**.
  - Public: viewable by anyone, follow is instant (no approval).
  - Private: not viewable without following, and following requires the owner's **approval** (pending-request state on the follow relationship). This is the one place v1 has an approval workflow — chosen specifically because a privacy toggle without approval would be meaningless.

### Creation & editor
- A zine is page-based with a **fixed aspect ratio**, chosen once at creation, so the flip-through reading experience is consistent.
- Editor blocks (v1): text boxes (with a curated font list), image upload, background color/gradient. No stickers/shapes/embeds yet.
- Creators start from either a **starter template** (4-6 aesthetic presets: palette + font pairing) or a **blank canvas**.
- A zine can be saved as a **draft** (editable) before publishing.
- Once **published, a zine is locked** (immutable) — matches the "printed issue" metaphor. A revision ships as a new zine, not an edit to the old one.
- A magazine can publish **multiple zines** over time.

### Social graph & feed
- Relationship model is **one-directional follow** only (Instagram-style) — no separate mutual "friend request" system. (Considered and deliberately simplified: two relationship graphs weren't justified without a private-content reason, and now private profiles cover that need via follow-approval instead.)
- **Feed = chronological zines from people you follow only.** No ranking/algorithm, no explore/discovery page in v1.
- **Engagement:** likes and comments only. No reposts/reshares.

### Explicitly deferred (v1 does NOT include, revisit later)
These came from a competitor-informed mock review (see **Mocks** below) that showed a fuller product vision. Each was deliberately kept out of v1 to stay lean, with the mocks kept as the target design to grow into:
- **Explore/discovery ("Library") page** — a global cross-creator browse view with category filters (Travel/Food/Art/Sports/etc. in the mock). v1 ships with follow-only feed and accepts the cold-start discovery gap.
- **Categorization/tags** on zines — not needed while there's no discovery surface to filter.
- **Standalone posts** (text-only updates or bare photo posts, independent of publishing a zine) — the mock feed shows these; v1 feed only reacts to zine-publish events.
- **Spreads grid** on a profile (browsing individual two-page spreads Instagram-grid-style) — v1 profile shows only **Zines** and **Drafts** tabs, no spread-level browsing/thumbnailing.
- **Notifications** (new follower/like/comment) — none in v1, in-app or otherwise.
- **Content moderation** — no reporting mechanism, no review queue in v1. **Deliberately accepted risk** while the user base is small; flagged to revisit as the platform grows.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) on Vercel, Fluid Compute/Node.js runtime | Handles the interactive editor (client components) and server-rendered reader/feed well; matches this environment's default. |
| Database | Neon Postgres | Data is genuinely relational — users (whose public profile is called a Magazine), zines, pages, follows (with pending state), likes, and comments all reference each other; the feed query is a join. Vercel's preferred managed Postgres. |
| ORM | Drizzle | Stays close to SQL, no heavy codegen/build step (vs. Prisma). |
| Image storage | Vercel Blob, `access: 'public'` | Published zine page images need to render directly. |
| Auth | Clerk (Vercel Marketplace native) | Auto-provisioned env vars, prebuilt sign-in/up UI, fits open signup. Email/password + Google OAuth. |

### Architecture — no separate backend
Next.js App Router serves both sides of the app: UI as Server/Client Components, and "backend" logic as Route Handlers (`app/api/**`) and Server Actions, running as Vercel Functions (Node.js/Fluid Compute). Those talk directly to Neon, Vercel Blob, and Clerk — no separate Express/FastAPI service in front of them. Revisit only if something needs a long-running process a request/response function can't do (e.g. a background worker).

### Known tradeoff — accepted for v1
Vercel Blob public URLs are long/unguessable but **not access-controlled**. This means a private magazine's page images are technically reachable by anyone with the exact URL, even though the profile itself is gated behind follow-approval. Accepted as a practical v1 tradeoff (same one most early-stage apps make); flagged to revisit alongside content moderation if private profiles become a serious use case.

## Mocks

Three mockups (`docs/designs/mocks/`) informed this session and are the reference for later phases:
- `newsstand-feed.jpg` — the feed screen (Newsstand). Shows the v1 zine-publish-event feed, plus deferred standalone-post types.
- `own-profile.jpg` — a magazine's own profile. Shows the deferred **Spreads** tab alongside the v1 **Zines**/**Drafts** tabs.
- `library-discovery-future.jpg` — the deferred global Library/discovery page with category filters.

## Open items for a future session
- Explore/discovery page design (once follow-only feed proves the core loop)
- Categorization taxonomy, if/when discovery ships
- Standalone post type, if the feed needs more than zine-publish events
- Spread pairing + thumbnailing, if spread-level browsing is prioritized
- Real access control for private-profile images (signed URLs) if needed
- Moderation/reporting system, once user base grows
