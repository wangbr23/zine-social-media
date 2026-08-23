# Decisions

Append-only log of architecture decisions. One entry per decision, newest at the bottom. Don't edit past entries — a reversed decision gets a new entry that supersedes the old one, rather than an edit.

## 2026-08-22 — Record architecture decisions

**Status:** Accepted

**Context:** We need a lightweight way to record why significant technical decisions were made, so future work — by any contributor, human or AI, in any tool — doesn't rediscover or accidentally reverse them without knowing the original reasoning.

**Decision:** We will keep architecture decisions in `docs/decisions.md`, one entry per decision, appended chronologically. Entries are append-only — a changed decision gets a new entry that supersedes the old one, rather than an edit.

**Consequences:** Decisions and their reasoning survive context resets, tool switches, and contributor turnover.

## 2026-08-22 — Stack: Next.js + Neon + Drizzle + Vercel Blob + Clerk

**Status:** Accepted

**Context:** The idea (a zine/flipbook social platform — see `docs/designs/zine-social-platform.md`) was resolved via a `/grill-me` session. The data model is genuinely relational (users, magazines, zines, pages, follows with a pending-approval state, likes, comments — feed is a join over follows), and the app needs image upload storage plus auth supporting open signup.

**Decision:** Next.js (App Router) on Vercel, Neon Postgres via Drizzle ORM, Vercel Blob (`access: 'public'`) for page images, Clerk for auth (email/password + Google OAuth). All chosen as the Vercel-preferred/native Marketplace option for their category rather than an unvetted default.

**Consequences:** Relational joins (feed, follow-graph) are natural in Postgres. Private-profile page images are not truly access-controlled under public Blob URLs — accepted as a v1 tradeoff, tracked in the design doc's open items. Auth, DB, and storage all auto-provision env vars via Vercel Marketplace, so setup should be low-friction.

## 2026-08-22 — Follow requires approval on private magazines only

**Status:** Accepted

**Context:** The social graph is one-directional follow (not mutual friend requests), which was deliberately simplified during design to avoid a second relationship graph. But magazines can be set private, and instant-follow on a private profile would make the privacy toggle meaningless.

**Decision:** Public magazines keep instant, no-approval follow. Private magazines add a single pending-approval state to the follow relationship, approved/denied by the owner — no separate friend-request system.

**Consequences:** The follow relationship needs a status field (`accepted`/`pending`), not just a boolean edge. No notification system exists in v1 to alert an owner of a pending request, so the pending-requests list must be discoverable from within the app (e.g. a requests screen on the profile) rather than pushed.

## 2026-08-22 — No moderation and no discovery surface in v1 (deliberate, not an oversight)

**Status:** Accepted

**Context:** Mock review during the design session (`docs/designs/mocks/`) showed a fuller intended product — a global Library/discovery page with categorization, and richer feed content types — beyond what was scoped for v1.

**Decision:** v1 ships with no content moderation/reporting, no explore/discovery page, no categorization, no standalone posts, and no spread-level browsing. The mocks are kept as the target design for later phases, not built now.

**Consequences:** Discovery is limited to follows + off-platform sharing until an explore page ships — accepted growth-path limitation. No moderation queue means abuse reports have nowhere to go yet; this must be revisited before the user base grows meaningfully, per the design doc's open items.

## 2026-08-22 — User is the sole account and public-profile entity

**Status:** Accepted; supersedes the earlier data-model assumption that users and magazines need separate tables.

**Context:** The v1 product allows exactly one Magazine profile per authenticated user. A separate `magazines` table would therefore create a permanent one-to-one join without representing a distinct v1 entity.

**Decision:** Store Clerk identity and public Magazine profile fields together on `users`. Zines belong to a user, and follows, likes, and comments use user IDs. “Magazine” remains the product-facing name for a user's public profile, not a separate database entity.

**Consequences:** The v1 schema and queries are simpler and contain six domain tables: users, zines, pages, follows, likes, and comments. Supporting multiple magazines per account or collaborative magazine ownership later will require introducing a separate entity and migrating ownership references.

## 2026-08-22 — Sync Clerk to `users` via lazy upsert, not a webhook

**Status:** Proposed — flagged to the user, not yet confirmed.

**Context:** A `users` row needs to exist for a signed-in Clerk identity before it can own zines, follow, like, or comment. Two standard ways to create it: a Clerk webhook (`user.created`) hitting a public endpoint, or a lazy check-and-insert the first time an authenticated request needs the row.

**Decision:** Lazy upsert on first authenticated request. A webhook requires a public endpoint plus signature verification — real infrastructure this product doesn't otherwise need in v1, for a one-time per-user event that a lazy check handles just as correctly.

**Consequences:** No webhook endpoint or Clerk webhook-secret configuration needed. The first authenticated request from a new user pays one extra existence-check/insert. This also has to be where the handle/display-name onboarding step (T13) hooks in, since the row won't have a valid `handle` yet on creation.

## 2026-08-22 — Create the database user during onboarding

**Status:** Accepted; refines the proposed lazy-upsert decision above.

**Context:** Clerk provides identity and email but not the app's required, unique handle. The database also requires a display name. Creating a `users` row on the first authenticated request would therefore require nullable fields or a fake temporary handle before onboarding.

**Decision:** Resolve each Clerk session against `users`. If no row exists, send document requests to `/onboarding`. Onboarding collects and validates the handle and display name, then atomically inserts the complete row using Clerk's server-side identity and email. API actions require both an authenticated Clerk session and an existing database user.

**Consequences:** User rows are never incomplete, handle claims remain protected by the database uniqueness constraint, and no webhook is needed for v1. Every new authenticated user must finish onboarding before using protected application features.
