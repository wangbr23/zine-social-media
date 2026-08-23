"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { follows, users } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";

export async function toggleProfileVisibility() {
  const user = await requireCurrentDatabaseUser();
  const visibility = user.visibility === "public" ? "private" : "public";

  await db
    .update(users)
    .set({ visibility, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  revalidatePath("/profile");
  revalidatePath(`/magazine/${user.handle}`);
}

export async function approveFollowRequest(requestId: string) {
  const user = await requireCurrentDatabaseUser();

  await db
    .update(follows)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(
      and(
        eq(follows.id, requestId),
        eq(follows.followedUserId, user.id),
        eq(follows.status, "pending"),
      ),
    );

  revalidatePath("/profile");
  revalidatePath("/newsstand");
}

export async function denyFollowRequest(requestId: string) {
  const user = await requireCurrentDatabaseUser();

  await db
    .delete(follows)
    .where(
      and(
        eq(follows.id, requestId),
        eq(follows.followedUserId, user.id),
        eq(follows.status, "pending"),
      ),
    );

  revalidatePath("/profile");
}
