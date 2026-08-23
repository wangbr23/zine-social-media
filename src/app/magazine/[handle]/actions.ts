"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { follows, users } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";

export async function toggleFollow(targetUserId: string) {
  const viewer = await requireCurrentDatabaseUser();

  if (viewer.id === targetUserId) return;

  const [target] = await db
    .select({ id: users.id, handle: users.handle, visibility: users.visibility })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target) return;

  const [existing] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(
        eq(follows.followerUserId, viewer.id),
        eq(follows.followedUserId, target.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id));
  } else {
    const acceptedAt = target.visibility === "public" ? new Date() : null;

    await db
      .insert(follows)
      .values({
        followerUserId: viewer.id,
        followedUserId: target.id,
        status: acceptedAt ? "accepted" : "pending",
        acceptedAt,
      })
      .onConflictDoNothing();
  }

  revalidatePath(`/magazine/${target.handle}`);
  revalidatePath("/profile");
  revalidatePath("/newsstand");
}
