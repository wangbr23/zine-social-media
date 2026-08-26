import Link from "next/link";

import { BottomNav } from "@/components/editorial/bottom-nav";
import { Masthead } from "@/components/editorial/masthead";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import { searchProfiles } from "@/lib/profile/queries";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await requireCurrentDatabaseUser();
  const { q } = await searchParams;
  const query = q?.trim().slice(0, 80) ?? "";
  const profiles = query ? await searchProfiles(query) : [];

  return (
    <main className="editorial-shell">
      <Masthead eyebrow="Find your people">Search</Masthead>

      <div className="mx-auto max-w-3xl">
        <form action="/search" className="flex gap-3" role="search">
          <label className="sr-only" htmlFor="profile-search">
            Search by handle or display name
          </label>
          <input
            className="min-w-0 flex-1 border border-black px-4 py-3 outline-none focus:border-[var(--editorial-blue)] focus:ring-2 focus:ring-[var(--editorial-blue)]"
            defaultValue={query}
            id="profile-search"
            maxLength={80}
            name="q"
            placeholder="Handle or display name"
            type="search"
          />
          <button
            className="editorial-button border border-black bg-black px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white"
            type="submit"
          >
            Search
          </button>
        </form>

        {query ? (
          <section aria-live="polite" className="editorial-rule mt-10">
            <p className="editorial-eyebrow py-5">
              {profiles.length
                ? `${profiles.length} ${profiles.length === 1 ? "result" : "results"}`
                : "No results"}
            </p>
            {profiles.length ? (
              <ul>
                {profiles.map((profile) => (
                  <li className="border-b border-[var(--editorial-rule)]" key={profile.id}>
                    <Link
                      className="group flex items-center gap-4 px-2 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--editorial-blue)]"
                      href={`/magazine/${profile.handle}`}
                    >
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="size-14 object-cover"
                          src={profile.avatarUrl}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="editorial-display grid size-14 shrink-0 place-items-center bg-[var(--editorial-blue)] text-2xl text-white"
                        >
                          {profile.displayName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <strong className="editorial-display block truncate text-2xl leading-none transition-colors group-hover:text-[var(--editorial-red)]">
                          {profile.displayName}
                        </strong>
                        <span className="text-sm text-[var(--editorial-blue)]">
                          @{profile.handle}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="editorial-serif text-lg text-black/65">
                No profiles match “{query}”. Try another handle or name.
              </p>
            )}
          </section>
        ) : (
          <section className="editorial-rule mt-10 py-10 text-center">
            <p className="editorial-serif text-lg text-black/65">
              Search for a creator by their handle or display name.
            </p>
          </section>
        )}
      </div>

      <BottomNav active="search" />
    </main>
  );
}
