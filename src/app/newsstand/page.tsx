import Link from "next/link";

import { BottomNav } from "@/components/editorial/bottom-nav";
import { Masthead } from "@/components/editorial/masthead";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";

export default async function NewsstandPage() {
  await requireCurrentDatabaseUser();

  return (
    <main className="editorial-shell">
      <Masthead>Newsstand</Masthead>

      <div className="mx-auto max-w-6xl">
        <section className="editorial-rule py-14 text-center">
          <p className="editorial-eyebrow">Your reading list</p>
          <h1 className="editorial-display text-3xl md:text-5xl">
            THE STAND IS QUIET
          </h1>
          <p className="editorial-serif mx-auto mt-3 max-w-xl text-lg text-black/65 md:text-xl">
            New issues from people you follow will appear here in publishing
            order. Until then, start an issue of your own.
          </p>
          <Link
            className="editorial-button mt-7 inline-block bg-[var(--editorial-red)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white"
            href="/create"
          >
            Create a zine
          </Link>
        </section>
      </div>

      <BottomNav active="newsstand" />
    </main>
  );
}
