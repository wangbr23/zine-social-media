# zine-website

A social platform for creating, publishing, and browsing zines.

## Stack
- Language/runtime: Node.js (Vercel Fluid Compute)
- Framework: Next.js (App Router), deployed on Vercel
- Package manager: npm
- Database: Neon Postgres via Drizzle ORM
- Image storage: Vercel Blob
- Auth: Clerk (email/password + Google OAuth)

See `docs/designs/zine-social-platform.md` for the full product design and `docs/decisions.md` for why each of these was chosen.

## Commands
- Install: `npm install` (use `npm ci` for clean/CI installs)
- Dev/run: `npm run dev`; production server after a build: `npm run start`
- Test: not configured yet
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Database: `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`

Local development reads integration credentials from `.env.local`. On this machine, Neon/Vercel CLI commands may need `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem` so Node trusts the system certificate chain; never disable TLS verification.

## Conventions
Cross-project coding principles (KISS, no god files, surface conflicts, etc.) live in `~/.claude/CLAUDE.md` — don't restate them here. This section is only for what's specific to *this* repo:
- Code style: TypeScript strict mode, the `@/*` alias for `src/*`, and ESLint's Next.js Core Web Vitals + TypeScript rules. Prefer Server Components; add `"use client"` only for browser state or interactions. Style with Tailwind utilities and the shared editorial classes in `src/app/globals.css`.
- Mutations: Use colocated Server Actions and validate authorization and untrusted input on the server. Keep reusable domain logic under `src/lib/` rather than importing route actions into unrelated modules.
- Testing approach: No test framework is configured yet; add the command here when one is chosen.
- Commit message format: Short imperative summary; no Conventional Commits prefix is required.

## Architecture
- `src/app/` contains App Router routes. Public landing and magazine pages coexist with Clerk-backed onboarding, profile, Newsstand, draft creation, and the page editor. Mutations are implemented as route-colocated Server Actions.
- `src/proxy.ts` runs Clerk middleware. `src/lib/auth/user.ts` resolves a Clerk identity to the corresponding application user and redirects authenticated users without a database row to onboarding.
- `src/db/schema.ts` is the typed domain model for users, zines, pages, follows, likes, and comments. `src/db/index.ts` connects Drizzle to Neon over HTTP; `drizzle/` contains migrations.
- `src/lib/` holds reusable auth, profile-query, zine-layout, template, palette, and image-upload logic. Zine pages persist their background and ordered block array as JSONB; array order is also rendering z-order.
- `src/components/` contains shared editorial/profile UI and the reusable static-or-interactive `PageRenderer`. The editor under `src/app/create/[zineId]/` coordinates page state and focused canvas, toolbar, inspector, palette, layers, and page-rail components.
- Clerk owns sign-in and sessions, Neon owns relational application state, and Vercel Blob owns uploaded page images. The deployed app runs on Vercel.

## Context files
Keep these current — they're what gives any session, or either CLI tool, continuity without re-deriving history from scratch.

- **AGENTS.md** (this file) — stack, commands, conventions, architecture. Update only when one of those actually changes; it should stay stable day to day.
- **CLAUDE.md** — pointer to this file only. Don't duplicate content into it.
- **docs/journal.md** — append-only session log. Never edit past entries; if something turns out wrong, say so in a new one.
- **docs/decisions.md** — append-only log of significant technical decisions (dependency choices, schema changes, rejected approaches), one entry per decision. Never edit past entries — a reversed decision gets a new entry that supersedes the old one.
- **docs/designs/** — design documents (specs, mockups, research write-ups). One file per document; save the working version here rather than leaving it only in chat or artifact history.
- **TODO.md** — current and near-term work. The only file in this list meant to be edited freely rather than appended-only. Tasks carry an id, a manual/agent tag, and optional `depends-on` links so parallel-safe work can be computed rather than tracked by hand — see the `plan-tasks` skill.

**Before starting nontrivial work:** read this file, skim the last few journal entries, check TODO.md.
**After finishing a session:** append a journal entry (what changed, why, what's next), update TODO.md, and append a decision entry if a decision worth remembering was made.
