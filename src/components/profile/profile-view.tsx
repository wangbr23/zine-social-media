import Link from "next/link";
import type { ReactNode } from "react";

import { DeleteZineButton } from "@/components/zines/delete-draft-button";
import { PageRenderer } from "@/components/zines/page-renderer";
import type { DatabaseUser } from "@/lib/auth/user";
import type { PageBackground, PageBlock } from "@/db/schema";
import type { DeleteZineResult } from "@/lib/zines/draft-actions";

type ProfileZine = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  status: "draft" | "published";
  aspectWidth: number;
  aspectHeight: number;
  firstPageBackground: PageBackground | null;
  firstPageBlocks: PageBlock[] | null;
  updatedAt: Date;
  publishedAt: Date | null;
};

type ProfileViewProps = {
  profile: DatabaseUser;
  zines: ProfileZine[];
  tab: "zines" | "drafts";
  isOwner: boolean;
  toggleAction?: (formData: FormData) => Promise<void>;
  followControl?: ReactNode;
  deleteDraftAction?: (zineId: string) => Promise<DeleteZineResult>;
  deletePublishedAction?: (zineId: string) => Promise<DeleteZineResult>;
};

export function ProfileView({
  profile,
  zines,
  tab,
  isOwner,
  toggleAction,
  followControl,
  deleteDraftAction,
  deletePublishedAction,
}: ProfileViewProps) {
  const profilePath = isOwner ? "/profile" : `/magazine/${profile.handle}`;

  return (
    <div className="mx-auto max-w-6xl">
      <section className="border-b border-black pb-8 pt-3 md:flex md:items-end md:justify-between md:gap-10">
        <div className="flex min-w-0 items-start gap-5">
          {profile.avatarUrl ? (
            // Clerk avatar URLs are user-controlled remote URLs, so avoid requiring
            // a host allowlist merely to render an existing profile image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="size-20 shrink-0 object-cover md:size-28"
              src={profile.avatarUrl}
            />
          ) : (
            <div
              aria-hidden="true"
              className="editorial-display grid size-20 shrink-0 place-items-center bg-[var(--editorial-red)] text-4xl text-white md:size-28"
            >
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="editorial-eyebrow">Magazine</p>
            <h1 className="editorial-display break-words text-4xl leading-none md:text-6xl">
              {profile.displayName}
            </h1>
            <p className="mt-2 text-sm font-bold text-[var(--editorial-blue)]">
              @{profile.handle}
            </p>
            <p className="editorial-serif mt-3 max-w-2xl text-lg leading-snug">
              {profile.bio || "Writing about life, one page at a time."}
            </p>
          </div>
        </div>

        {isOwner && toggleAction ? (
          <form action={toggleAction} className="mt-6 shrink-0 md:mt-0">
            <button
              className="editorial-button border border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]"
              type="submit"
            >
              {profile.visibility === "public" ? "Make private" : "Make public"}
            </button>
            <p className="mt-2 text-right text-xs text-[var(--editorial-muted)]">
              Currently {profile.visibility}
            </p>
          </form>
        ) : (
          followControl
        )}
      </section>

      <nav
        aria-label="Profile sections"
        className={`mt-8 grid ${isOwner ? "grid-cols-2" : "grid-cols-1"} border-b border-[var(--editorial-rule)] text-center text-sm font-bold uppercase tracking-[0.14em]`}
      >
        <Link
          className={`pb-3 ${tab === "zines" ? "border-b-2 border-black" : "text-[var(--editorial-muted)]"}`}
          href={profilePath}
        >
          Zines
        </Link>
        {isOwner ? (
          <Link
            className={`pb-3 ${tab === "drafts" ? "border-b-2 border-black" : "text-[var(--editorial-muted)]"}`}
            href={`${profilePath}?tab=drafts`}
          >
            Drafts
          </Link>
        ) : null}
      </nav>

      {zines.length ? (
        <section className="grid gap-px bg-[var(--editorial-rule)] sm:grid-cols-2 lg:grid-cols-3">
          {zines.map((zine, index) => {
            const card = (
              <>
                <div className="relative aspect-[3/4] overflow-hidden bg-[#ededed]">
                  {zine.firstPageBackground && zine.firstPageBlocks ? (
                    <PageRenderer
                      aspectHeight={zine.aspectHeight}
                      aspectWidth={zine.aspectWidth}
                      className="size-full"
                      page={{
                        background: zine.firstPageBackground,
                        blocks: zine.firstPageBlocks,
                      }}
                    />
                  ) : zine.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="size-full object-cover"
                      src={zine.coverImageUrl}
                    />
                  ) : (
                    <div className="flex size-full flex-col justify-between p-5">
                      <span className="text-xs font-bold uppercase tracking-[0.18em]">
                        Issue {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong className="editorial-display text-4xl leading-none text-[var(--editorial-red)]">
                        {zine.title}
                      </strong>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--editorial-blue)]">
                  {zine.status === "draft" ? "Draft" : "Published"}
                </p>
                <h2 className="editorial-display mt-1 text-2xl leading-tight transition-colors group-hover:text-[var(--editorial-red)]">
                  {zine.title}
                </h2>
                {zine.description ? (
                  <p className="editorial-serif mt-2 line-clamp-2 text-sm text-black/65">
                    {zine.description}
                  </p>
                ) : null}
              </>
            );

            return (
              <article className="bg-white p-5" key={zine.id}>
                {zine.status === "draft" ? (
                  <>
                    <Link
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--editorial-blue)]"
                      href={`/create/${zine.id}`}
                    >
                      {card}
                    </Link>
                    {deleteDraftAction ? (
                      <DeleteZineButton
                        action={deleteDraftAction.bind(null, zine.id)}
                        className="editorial-text-link mt-4 text-sm font-bold text-red-700 disabled:opacity-50"
                        label="draft"
                        title={zine.title}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <Link
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--editorial-blue)]"
                      href={`/magazine/${profile.handle}/${zine.slug}`}
                    >
                      {card}
                    </Link>
                    {deletePublishedAction ? (
                      <DeleteZineButton
                        action={deletePublishedAction.bind(null, zine.id)}
                        className="editorial-text-link mt-4 text-sm font-bold text-red-700 disabled:opacity-50"
                        label="published zine"
                        title={zine.title}
                      />
                    ) : null}
                  </>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="py-16 text-center">
          <p className="editorial-display text-3xl">
            {tab === "drafts" ? "NO DRAFTS YET" : "NO ISSUES YET"}
          </p>
          <p className="editorial-serif mx-auto mt-2 max-w-md text-lg text-black/65">
            {isOwner
              ? tab === "drafts"
                ? "Works in progress will wait for you here."
                : "Your published zines will live here. Start with a blank page or a template."
              : "This magazine has not published an issue yet."}
          </p>
          {isOwner ? (
            <Link
              className="editorial-button mt-5 inline-block bg-black px-5 py-3 text-sm font-bold uppercase tracking-wide text-white"
              href="/create"
            >
              Create a zine
            </Link>
          ) : null}
        </section>
      )}
    </div>
  );
}
