# Journal

Append-only. One entry per work session. Newest at the bottom. Don't edit past entries — if something's wrong now, say so in a new entry.

## 2026-08-22 — project created

Initialized project scaffold (AGENTS.md, decisions log, TODO). Nothing built yet. Stack and architecture are undecided — the project is a social platform for creating, publishing, and browsing zines, but no tech choices have been made pending a `/grill-me` session to work through the idea.

## 2026-08-22 — Grilled the idea, resolved stack, wrote design doc

Ran a full `/grill-me` session on the zine social platform idea: product shape (magazine/zine/page vocabulary, page-based flipbook editor, one-directional follow with approval on private profiles, follow-only chronological feed, likes+comments, deliberately no moderation/discovery/notifications for v1) and stack (Next.js + Neon/Drizzle + Vercel Blob + Clerk, chosen via the Vercel Marketplace/storage/auth skills rather than guessed).

Partway through, reviewed three UI mocks the user had made (`docs/designs/mocks/`) — they revealed a fuller intended product (global Library/discovery with categories, richer feed post types, a "Spreads" browsing tab) beyond v1 scope. Went back through each conflict explicitly rather than silently reconciling; user chose to keep v1 lean and defer all three, with the mocks kept as the target design to grow into.

Full writeup: `docs/designs/zine-social-platform.md`. Decisions logged: `docs/decisions.md`.

**Next:** scaffold the Next.js project and provision Neon/Blob/Clerk per the stack decision.

## 2026-08-22 — Scaffolded the Next.js application

Completed T3 by generating a Next.js 16 App Router project with TypeScript, ESLint, Tailwind CSS, a `src/` layout, and npm. Preserved the existing project context files and design mocks while merging the generated application into the repository root. Removed the starter's build-time Google Fonts dependency in favor of system fonts so builds remain deterministic in restricted and CI environments, and replaced the generic starter metadata with the Zine product identity.

Validation passes with `npm run lint` and `npm run build -- --webpack`. The webpack flag was used for verification because Turbopack's CSS worker cannot bind its helper port inside the current sandbox.

**Next:** T4-T6 are now unblocked: provision Neon Postgres, Vercel Blob, and Clerk. T8 can also document the npm commands.

## 2026-08-22 — Provisioned hosted services

The user provisioned and connected all three v1 hosted services to the `zine-social-media` Vercel project: Neon Postgres (T4), Vercel Blob (T5), and Clerk (T6). These were completed through Vercel's dashboard because local Vercel CLI login was blocked by Node's certificate trust configuration.

No Vercel project metadata or development environment variables have been pulled into the local workspace yet.

**Next:** sync the integration-provided development variables into `.env.local`, then begin T7 (Drizzle schema and migrations). T8 is also ready.

## 2026-08-22 — Implemented and migrated the v1 data model

Completed T7 with Drizzle ORM 0.45, Drizzle Kit, and Neon's serverless driver. Added a typed schema for users, zines, pages, follows, likes, and comments; page editor state uses typed JSONB while social relationships remain relational. Added database constraints and indexes for handles, slugs, page ordering, publish state, follow approval state, feed access, likes, and comments.

During review, simplified the initial model by eliminating the one-to-one `magazines` table. The `users` table now contains both Clerk identity and the public profile called a Magazine in the UI. All ownership and social references use user IDs. This decision is recorded in `docs/decisions.md`.

Regenerated the initial migration after confirming that the interrupted earlier migration had created no public tables. Applied the revised migration to Neon and verified the six expected tables. Node required `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem` locally because its bundled trust store does not recognize this machine's network certificate chain.

Schema generation and the database migration pass. Final ESLint/build validation was impeded by inconsistent runtime exports from installed ESLint dependencies in the local `node_modules`; refreshing npm dependencies did not fully resolve the environment-specific behavior.

**Next:** T8 remains: document the project commands. Then begin application features against the migrated schema.

## 2026-08-22 — Documented project commands

Completed T8 by recording npm as the package manager and documenting install, development, production start, lint, typecheck, build, and Drizzle database commands in `AGENTS.md`. Added the missing `npm run typecheck` script. Tests are explicitly marked as not configured rather than documenting a command that does not exist. Also recorded the machine-specific trusted-CA requirement for local Neon/Vercel commands without weakening TLS verification.

**Next:** All initial TODO tasks are complete. Define the next implementation slice for authentication, profiles, or the zine editor.

## 2026-08-22 — Planned the next task graph (T9-T22)

Audited the actual repo state against the design doc before planning further: `.env.local` only has `DATABASE_URL`/`DATABASE_URL_UNPOOLED` and `package.json` has no `@clerk/nextjs` or `@vercel/blob` — T5/T6 were provisioned on Vercel but never pulled/wired locally, so "done" in TODO.md meant "provisioned," not "usable from this repo." Also found that the schema's `users.handle` (required, unique, regex-constrained) has no collection step — Clerk's default sign-up doesn't ask for one.

Added T9-T22 to TODO.md covering: pulling env vars, wiring Clerk and Blob, syncing a Clerk session to a `users` row, a handle/display-name onboarding step, the zine creation/editor/publish/reader flow, the profile page, follow (with private-profile approval), likes/comments, the Newsstand feed, and the app shell/nav. Chose a lazy upsert (create-on-first-authenticated-request) over a Clerk webhook for the user-sync step (T12) to avoid standing up a public webhook endpoint for v1 — flagged to the user as a default, not a grilled decision.

Current frontier is just T9 (manual — pull Clerk/Blob env vars from the Vercel dashboard); T10 and T11 become parallel-safe once that's done.

**Next:** T9, then dispatch T10/T11 in parallel.

## 2026-08-22 — Credential exposure while starting T9

While preparing `.env.local` for T9 (adding empty placeholder lines for the Clerk/Blob keys), discovered the file had no trailing newline, so the `>>` append glued the first new line onto the end of the existing `DATABASE_URL` line. A diagnostic command written to redact secrets before printing only redacted after the *last* `=` on a line, and this corruption put real content after that point — so part of the Neon database password was printed into the session transcript.

Fixed the file corruption (inserted the missing newline; `DATABASE_URL`/`DATABASE_URL_UNPOOLED` values themselves are intact). Added `T23` to rotate the exposed Neon password — treat it as compromised since it's now in session history, not just a formatting fix.

**Next:** T23 (rotate DB password) before or alongside T9 (Clerk/Blob keys).

## 2026-08-22 — Wired Clerk and secure Blob upload tokens

Completed T10 and T11 in parallel after T9. Clerk now wraps the App Router with `ClerkProvider`, runs `clerkMiddleware` through Next.js 16's `src/proxy.ts`, and exposes catch-all `/sign-in` and `/sign-up` routes. Routes remain public by default so authorization can be enforced close to protected pages, data, and actions as those features are added.

Added `/api/zine-page-images/upload` for Vercel Blob client uploads. It authenticates token requests with Clerk, scopes pathnames to `zine-pages/<clerkUserId>/`, accepts JPEG/PNG/WebP/AVIF images up to 10 MiB, creates short-lived tokens, adds random suffixes, and disables overwrites. The Blob read/write token remains server-only, and unexpected SDK errors are not returned verbatim.

Both implementations passed their individual TypeScript and targeted ESLint checks; the Clerk work also passed a webpack production build. A combined validation invocation stalled in the previously documented local Node/dependency environment and was stopped without producing a diagnostic.

**Next:** Resolve the T12/T13 boundary by creating the `users` row during onboarding (or otherwise satisfying required handle/display-name fields), then implement authenticated user onboarding.

## 2026-08-22 — Implemented session resolution and onboarding

Rewrote and completed T12/T13 around the agreed lifecycle. Authenticated Clerk sessions are resolved against the Neon `users` table. A signed-in person without a row is redirected from the application entry point to `/onboarding`; signed-out visitors see a minimal landing page with Clerk sign-in/sign-up controls.

Onboarding prefills Clerk profile information, validates the required display name and normalized handle, checks handle availability for helpful feedback, and atomically inserts a complete user row using server-trusted Clerk identity, primary email, and avatar. Database uniqueness remains the final race-safe authority. Existing users cannot repeat onboarding. The Blob token endpoint now also requires an existing database user, preventing pre-onboarding accounts from using protected application functionality.

`npm run typecheck` passes and `git diff --check` is clean. ESLint and the webpack build failed before examining/compiling project code because installed dependency modules again returned inconsistent exports (`eslint-plugin-react` and Next's compiled Edge runtime); this is the same local `node_modules` issue documented previously.

**Next:** T14, T18, and T22 are now unblocked. The most direct core-flow step is T14: create new draft zines.

## 2026-08-22 — Applied the mock-inspired editorial UI system

Reviewed the three Desktop references (`zine1.JPG`, `zine2.JPG`, `zine3.JPG`) and translated their shared visual language into reusable components and global styles: oversized condensed red mastheads, black rules, blue link accents, editorial serif copy, square controls, generous white space, and the gray icon navigation used in the authenticated product.

Restyled the public landing page, Clerk sign-in/sign-up surfaces, onboarding, and the initial signed-in profile state. After review, removed the mobile-device-width frame so the design fills the viewport responsively, with constrained reading columns only where useful. The bottom navigation now renders only for fully signed-in/onboarded application users; it is absent from the public landing, sign-in, sign-up, and onboarding screens.

`npm run typecheck` and `git diff --check` pass.

**Next:** Continue the same editorial system while implementing T14, then turn the placeholder authenticated navigation into real routes during T22.

## 2026-08-22 — Added draft creation, profiles, and app navigation

Completed T14, T18, and T22 in parallel with isolated route ownership, then reviewed and integrated the combined result. Authenticated users can create draft zines with a validated title, fixed portrait/square/landscape ratio, and blank or starter-template choice. Drafts receive readable collision-safe per-user slugs and redirect to an owner-only confirmation route reserved for the T15 editor.

Added owner and public Magazine profile pages. Owners can switch between published Zines and private Drafts and toggle public/private visibility. Public profile queries expose only published zines; private profiles require ownership or an accepted follow relationship. Added real Newsstand/Create/Profile navigation, removed the deferred Library item, preserved the public landing page, and route onboarded users from `/` to `/newsstand`.

Integration review removed a stale duplicate route artifact and separated browser-safe zine option constants from server-only draft creation logic after the production build detected a server module entering the client bundle.

Combined validation passes: `npm run typecheck`, targeted ESLint, `git diff --check`, and `npm run build -- --webpack`. The build reports all expected application routes and Proxy middleware.

**Next:** T15 (page editor, now unblocked by T14/T11) and T19 (follow/private approval, now unblocked by T18) can proceed independently.

## 2026-08-22 — Fixed production draft creation diagnostics and SQL

Investigated the generic production failure from the Create Draft action. The two-round-trip optimization used Drizzle column interpolation inside an `INSERT` column list, which qualifies names (for example, `"zines"."user_id"`) where PostgreSQL requires unqualified identifiers. Corrected the insert column and returning lists while keeping all dynamic values parameterized.

The Server Action now logs the original exception in Vercel with a generated error reference and returns only that reference to the browser, preserving useful diagnostics without exposing database details. A non-mutating `EXPLAIN` against Neon confirms the corrected INSERT syntax and query plan are valid and created no row.

Local full typecheck attempts continued to intermittently stall in the previously documented Node/dependency environment, so they were stopped without a diagnostic.

**Next:** Deploy the correction, retry draft creation, and use the displayed reference to find `Draft creation failed` in Vercel logs if another error occurs.
