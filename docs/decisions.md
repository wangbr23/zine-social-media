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
