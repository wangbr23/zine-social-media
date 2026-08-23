import { BottomNav } from "@/components/editorial/bottom-nav";
import { ProfileView } from "@/components/profile/profile-view";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import { getDraftZines, getPublishedZines } from "@/lib/profile/queries";

import { toggleProfileVisibility } from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireCurrentDatabaseUser();
  const { tab: requestedTab } = await searchParams;
  const tab = requestedTab === "drafts" ? "drafts" : "zines";
  const profileZines =
    tab === "drafts"
      ? await getDraftZines(user.id)
      : await getPublishedZines(user.id);

  return (
    <main className="editorial-shell">
      <ProfileView
        isOwner
        profile={user}
        tab={tab}
        toggleAction={toggleProfileVisibility}
        zines={profileZines}
      />
      <BottomNav active="profile" />
    </main>
  );
}
