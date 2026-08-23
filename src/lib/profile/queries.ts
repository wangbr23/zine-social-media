import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { follows, users, zines } from "@/db/schema";

export async function findProfileByHandle(handle: string) {
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.handle, handle.toLowerCase()))
    .limit(1);

  return profile ?? null;
}

export async function canViewPrivateProfile(
  profileUserId: string,
  viewerUserId?: string,
) {
  if (!viewerUserId) return false;
  if (profileUserId === viewerUserId) return true;

  const [follow] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(
        eq(follows.followerUserId, viewerUserId),
        eq(follows.followedUserId, profileUserId),
        eq(follows.status, "accepted"),
      ),
    )
    .limit(1);

  return Boolean(follow);
}

export async function getFollowStatus(
  profileUserId: string,
  viewerUserId?: string,
) {
  if (!viewerUserId || profileUserId === viewerUserId) return null;

  const [follow] = await db
    .select({ status: follows.status })
    .from(follows)
    .where(
      and(
        eq(follows.followerUserId, viewerUserId),
        eq(follows.followedUserId, profileUserId),
      ),
    )
    .limit(1);

  return follow?.status ?? null;
}

export function getPendingFollowRequests(userId: string) {
  return db
    .select({
      id: follows.id,
      displayName: users.displayName,
      handle: users.handle,
      createdAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerUserId))
    .where(
      and(
        eq(follows.followedUserId, userId),
        eq(follows.status, "pending"),
      ),
    )
    .orderBy(desc(follows.createdAt));
}

export function getPublishedZines(userId: string) {
  return db
    .select()
    .from(zines)
    .where(and(eq(zines.userId, userId), eq(zines.status, "published")))
    .orderBy(desc(zines.publishedAt));
}

export function getDraftZines(userId: string) {
  return db
    .select()
    .from(zines)
    .where(and(eq(zines.userId, userId), eq(zines.status, "draft")))
    .orderBy(desc(zines.updatedAt));
}
