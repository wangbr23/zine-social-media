import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ZineReader } from "@/components/zines/zine-reader";
import { ZineEngagement } from "@/components/zines/zine-engagement";
import { getCurrentDatabaseUser } from "@/lib/auth/user";
import {
  canViewPrivateProfile,
  findProfileByHandle,
} from "@/lib/profile/queries";
import {
  getPublishedZineForReader,
  getZineEngagement,
} from "@/lib/zines/reader";

import { addZineComment, toggleZineLike } from "./actions";

type ZineReaderPageProps = {
  params: Promise<{ handle: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: ZineReaderPageProps): Promise<Metadata> {
  const { handle, slug } = await params;
  const profile = await findProfileByHandle(handle);

  if (!profile) return {};

  if (profile.visibility === "private") {
    return {
      title: "Private Issue | Zine",
      description: "This issue is available only to accepted followers.",
      robots: { index: false, follow: false },
      openGraph: {
        title: "Private Issue | Zine",
        description: "This issue is available only to accepted followers.",
        type: "article",
      },
      twitter: { card: "summary_large_image" },
    };
  }

  const zine = await getPublishedZineForReader(profile.id, slug);
  if (!zine) return {};

  const title = `${zine.title} by ${profile.displayName} | Zine`;
  const description =
    zine.description ?? `Read ${zine.title}, a zine by ${profile.displayName}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

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

  const engagement = await getZineEngagement(zine.id, viewer?.id);
  const likeAction = toggleZineLike.bind(null, zine.id);
  const commentAction = addZineComment.bind(null, zine.id);

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
        palette={zine.palette}
        title={zine.title}
      />
      <ZineEngagement
        {...engagement}
        commentAction={commentAction}
        isSignedIn={Boolean(viewer)}
        likeAction={likeAction}
      />
    </main>
  );
}
