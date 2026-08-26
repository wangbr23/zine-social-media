import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { FollowButton } from "@/components/profile/follow-button";
import { ProfileView } from "@/components/profile/profile-view";
import { getCurrentDatabaseUser } from "@/lib/auth/user";
import {
  canViewPrivateProfile,
  findProfileByHandle,
  getFollowStatus,
  getPublishedZines,
} from "@/lib/profile/queries";

import { toggleFollow } from "./actions";

type PublicProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await findProfileByHandle(handle);

  if (!profile) return {};

  if (profile.visibility === "private") {
    return {
      title: "Private Magazine | Zine",
      description: "This magazine is available only to accepted followers.",
      robots: { index: false, follow: false },
      openGraph: {
        title: "Private Magazine | Zine",
        description: "This magazine is available only to accepted followers.",
        type: "profile",
      },
      twitter: { card: "summary_large_image" },
    };
  }

  const title = `${profile.displayName} (@${profile.handle}) | Zine`;
  const description =
    profile.bio ?? `Read published zines by ${profile.displayName}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { handle } = await params;
  const [profile, viewer] = await Promise.all([
    findProfileByHandle(handle),
    getCurrentDatabaseUser(),
  ]);

  if (!profile) notFound();

  const isOwner = viewer?.id === profile.id;
  const followStatus = await getFollowStatus(profile.id, viewer?.id);
  const followControl = !isOwner ? (
    viewer ? (
      <FollowButton
        action={toggleFollow.bind(null, profile.id)}
        status={followStatus}
      />
    ) : (
      <Link
        className="editorial-button inline-block border border-black bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white"
        href="/sign-in"
      >
        Sign in to follow
      </Link>
    )
  ) : null;
  const mayView =
    profile.visibility === "public" ||
    (await canViewPrivateProfile(profile.id, viewer?.id));

  if (!mayView) {
    return (
      <main className="editorial-shell">
        <div className="mx-auto max-w-3xl border-y border-black py-12 text-center">
          <p className="editorial-eyebrow">Private Magazine</p>
          <h1 className="editorial-display text-5xl md:text-7xl">
            {profile.displayName}
          </h1>
          <p className="mt-2 text-sm font-bold text-[var(--editorial-blue)]">
            @{profile.handle}
          </p>
          <p className="editorial-serif mx-auto mt-6 max-w-md text-lg">
            This magazine is private. Its issues are available only to accepted
            followers.
          </p>
          <div className="mt-6 flex justify-center">{followControl}</div>
        </div>
      </main>
    );
  }

  const publishedZines = await getPublishedZines(profile.id);

  return (
    <main className="editorial-shell">
      <ProfileView
        isOwner={isOwner}
        followControl={followControl}
        profile={profile}
        tab="zines"
        zines={publishedZines}
      />
    </main>
  );
}
