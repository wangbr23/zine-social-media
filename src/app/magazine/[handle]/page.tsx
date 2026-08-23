import { notFound } from "next/navigation";

import { ProfileView } from "@/components/profile/profile-view";
import { getCurrentDatabaseUser } from "@/lib/auth/user";
import {
  canViewPrivateProfile,
  findProfileByHandle,
  getPublishedZines,
} from "@/lib/profile/queries";

type PublicProfilePageProps = {
  params: Promise<{ handle: string }>;
};

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
        </div>
      </main>
    );
  }

  const publishedZines = await getPublishedZines(profile.id);

  return (
    <main className="editorial-shell">
      <ProfileView
        isOwner={isOwner}
        profile={profile}
        tab="zines"
        zines={publishedZines}
      />
    </main>
  );
}
