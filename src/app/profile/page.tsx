import { BottomNav } from "@/components/editorial/bottom-nav";
import { ProfileView } from "@/components/profile/profile-view";
import { FollowRequests } from "@/components/profile/follow-requests";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import { deleteDraftZine } from "@/lib/zines/draft-actions";
import {
  getDraftZines,
  getPendingFollowRequests,
  getPublishedZines,
} from "@/lib/profile/queries";

import {
  approveFollowRequest,
  denyFollowRequest,
  toggleProfileVisibility,
} from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireCurrentDatabaseUser();
  const { tab: requestedTab } = await searchParams;
  const tab = requestedTab === "drafts" ? "drafts" : "zines";
  const [profileZines, followRequests] = await Promise.all([
    tab === "drafts"
      ? getDraftZines(user.id)
      : getPublishedZines(user.id),
    getPendingFollowRequests(user.id),
  ]);

  return (
    <main className="editorial-shell">
      <FollowRequests
        approveAction={approveFollowRequest}
        denyAction={denyFollowRequest}
        requests={followRequests}
      />
      <ProfileView
        deleteDraftAction={deleteDraftZine}
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
