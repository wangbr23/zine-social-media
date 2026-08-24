import Link from "next/link";

import { BottomNav } from "@/components/editorial/bottom-nav";
import { Masthead } from "@/components/editorial/masthead";
import { PageRenderer } from "@/components/zines/page-renderer";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import { getNewsstandZines } from "@/lib/newsstand/queries";

const publishedDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

export default async function NewsstandPage() {
  const user = await requireCurrentDatabaseUser();
  const feed = await getNewsstandZines(user.id);

  return (
    <main className="editorial-shell">
      <Masthead>Newsstand</Masthead>

      <div className="mx-auto max-w-5xl">
        {feed.length ? (
          <section aria-label="Latest issues" className="editorial-rule">
            {feed.map((zine) => (
              <article
                className="grid gap-6 border-b border-[var(--editorial-rule)] py-8 md:grid-cols-[minmax(220px,2fr)_3fr] md:gap-10"
                key={zine.id}
              >
                <Link
                  aria-label={`Read ${zine.title} by ${zine.creatorDisplayName}`}
                  className="group block overflow-hidden bg-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--editorial-blue)]"
                  href={`/magazine/${zine.creatorHandle}/${zine.slug}`}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    {zine.firstPageBackground && zine.firstPageBlocks ? (
                      <PageRenderer
                        aspectHeight={zine.aspectHeight}
                        aspectWidth={zine.aspectWidth}
                        className="size-full transition-transform duration-200 group-hover:scale-[1.02]"
                        page={{
                          background: zine.firstPageBackground,
                          blocks: zine.firstPageBlocks,
                        }}
                      />
                    ) : zine.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        src={zine.coverImageUrl}
                      />
                    ) : (
                      <div className="flex size-full items-end p-6">
                        <strong className="editorial-display text-4xl leading-none text-[var(--editorial-red)]">
                          {zine.title}
                        </strong>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="self-center">
                  <Link
                    className="inline-flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--editorial-blue)]"
                    href={`/magazine/${zine.creatorHandle}`}
                  >
                    {zine.creatorAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="size-10 object-cover"
                        src={zine.creatorAvatarUrl}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="editorial-display grid size-10 place-items-center bg-[var(--editorial-blue)] text-xl text-white"
                      >
                        {zine.creatorDisplayName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span>
                      <strong className="block text-sm">
                        {zine.creatorDisplayName}
                      </strong>
                      <span className="text-xs text-[var(--editorial-blue)]">
                        @{zine.creatorHandle}
                      </span>
                    </span>
                  </Link>

                  <p className="editorial-eyebrow mt-8">
                    Published{" "}
                    {zine.publishedAt
                      ? publishedDateFormatter.format(zine.publishedAt)
                      : "recently"}
                  </p>
                  <Link
                    className="group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--editorial-blue)]"
                    href={`/magazine/${zine.creatorHandle}/${zine.slug}`}
                  >
                    <h2 className="editorial-display text-4xl leading-none transition-colors group-hover:text-[var(--editorial-red)] md:text-5xl">
                      {zine.title}
                    </h2>
                    {zine.description ? (
                      <p className="editorial-serif mt-4 line-clamp-3 text-lg text-black/65">
                        {zine.description}
                      </p>
                    ) : null}
                    <span className="editorial-text-link mt-6 inline-block text-sm font-bold uppercase tracking-[0.12em]">
                      Read issue →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="editorial-rule py-14 text-center">
            <p className="editorial-eyebrow">Your reading list</p>
            <h1 className="editorial-display text-3xl md:text-5xl">
              THE STAND IS QUIET
            </h1>
            <p className="editorial-serif mx-auto mt-3 max-w-xl text-lg text-black/65 md:text-xl">
              Published issues from people you follow will appear here, newest
              first. Until then, start an issue of your own.
            </p>
            <Link
              className="editorial-button mt-7 inline-block bg-[var(--editorial-red)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white"
              href="/create"
            >
              Create a zine
            </Link>
          </section>
        )}
      </div>

      <BottomNav active="newsstand" />
    </main>
  );
}
