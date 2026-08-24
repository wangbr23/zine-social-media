import Link from "next/link";
import { notFound } from "next/navigation";

import { ZineReader } from "@/components/zines/zine-reader";
import { getCurrentDatabaseUser } from "@/lib/auth/user";
import {
  canViewPrivateProfile,
  findProfileByHandle,
} from "@/lib/profile/queries";
import { getPublishedZineForReader } from "@/lib/zines/reader";

type ZineReaderPageProps = {
  params: Promise<{ handle: string; slug: string }>;
};

export default async function ZineReaderPage({ params }: ZineReaderPageProps) {
  const { handle, slug } = await params;
  const [profile, viewer] = await Promise.all([
    findProfileByHandle(handle),
    getCurrentDatabaseUser(),
  ]);

  if (!profile) notFound();

  const mayView =
    profile.visibility === "public" ||
    (await canViewPrivateProfile(profile.id, viewer?.id));

  if (!mayView) {
    return (
      <main className="editorial-shell">
        <div className="mx-auto max-w-3xl border-y border-black py-12 text-center">
          <p className="editorial-eyebrow">Private Magazine</p>
          <h1 className="editorial-display text-5xl md:text-7xl">
            This issue is private
          </h1>
          <p className="editorial-serif mx-auto mt-5 max-w-md text-lg">
            Issues from @{profile.handle} are available only to the owner and
            accepted followers.
          </p>
          <Link
            className="editorial-button mt-7 inline-block border border-black bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white"
            href={`/magazine/${profile.handle}`}
          >
            Visit the magazine
          </Link>
        </div>
      </main>
    );
  }

  const zine = await getPublishedZineForReader(profile.id, slug);

  if (!zine) notFound();

  return (
    <main className="editorial-shell">
      <header className="mx-auto max-w-3xl border-b border-black pb-5">
        <Link
          className="editorial-text-link text-xs font-bold uppercase tracking-[0.14em]"
          href={`/magazine/${profile.handle}`}
        >
          ← {profile.displayName}
        </Link>
        <p className="editorial-eyebrow mt-6">Published issue</p>
        <h1 className="editorial-display text-4xl leading-none md:text-6xl">
          {zine.title}
        </h1>
        {zine.description ? (
          <p className="editorial-serif mt-3 max-w-2xl text-lg text-black/65">
            {zine.description}
          </p>
        ) : null}
      </header>

      <ZineReader
        aspectHeight={zine.aspectHeight}
        aspectWidth={zine.aspectWidth}
        pages={zine.pages}
        title={zine.title}
      />
    </main>
  );
}
