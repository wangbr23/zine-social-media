# Zine

Zine is a social platform for making, publishing, and browsing page-based digital zines. Creators can build multi-page drafts from a blank canvas or an editorial starter, arrange text and uploaded images on a fixed-layout page, and maintain a public or private magazine profile.

The app is built with Next.js App Router and TypeScript. Clerk provides authentication, Neon Postgres stores application data through Drizzle ORM, Vercel Blob stores page images, and Vercel hosts the production application.

## Local development

Requirements:

- Node.js and npm
- A Clerk application
- A Neon Postgres database
- A Vercel Blob store

Install dependencies:

```bash
npm install
```

Create `.env.local` with the integration credentials used by the app:

```dotenv
DATABASE_URL=
DATABASE_URL_UNPOOLED=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
BLOB_READ_WRITE_TOKEN=
```

Apply the existing database migrations, then start the development server:

```bash
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). New Clerk users complete onboarding before entering the authenticated application.

On this machine, Node-based Neon or Vercel commands may require `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem`. Do not disable TLS verification.

## Commands

```bash
npm run dev          # development server
npm run typecheck    # TypeScript validation
npm run lint         # ESLint
npm run build        # production build
npm run start        # serve a completed production build
npm run db:generate  # generate a Drizzle migration
npm run db:migrate   # apply Drizzle migrations
npm run db:studio    # open Drizzle Studio
```

No automated test framework is configured yet.

## Project context

- [`docs/designs/zine-social-platform.md`](docs/designs/zine-social-platform.md) describes the product.
- [`docs/decisions.md`](docs/decisions.md) records architecture and scope decisions.
- [`TODO.md`](TODO.md) tracks completed and upcoming work.
- [`AGENTS.md`](AGENTS.md) documents repository-specific development guidance.

Production is deployed through Vercel. Configure the same integration variables for the appropriate Vercel environments before deploying.
