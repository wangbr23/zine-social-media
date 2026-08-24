"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { comments, likes, users, zines } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import { canViewPrivateProfile } from "@/lib/profile/queries";

export type CommentState = { error?: string; submissionCount?: number };

async function getEngageableZine(zineId: string, viewerId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(zineId)) {
    return null;
  }

  const [zine] = await db
    .select({
      id: zines.id,
      ownerId: zines.userId,
      handle: users.handle,
      slug: zines.slug,
      visibility: users.visibility,
    })
    .from(zines)
    .innerJoin(users, eq(users.id, zines.userId))
    .where(and(eq(zines.id, zineId), eq(zines.status, "published")))
    .limit(1);

  if (!zine) return null;
  if (
    zine.visibility === "private" &&
    !(await canViewPrivateProfile(zine.ownerId, viewerId))
  ) {
    return null;
  }

  return zine;
}

export async function toggleZineLike(zineId: string) {
  const viewer = await requireCurrentDatabaseUser();
  const zine = await getEngageableZine(zineId, viewer.id);

  if (!zine) return;

  const [removed] = await db
    .delete(likes)
    .where(and(eq(likes.zineId, zine.id), eq(likes.userId, viewer.id)))
    .returning({ id: likes.id });

  if (!removed) {
    await db
      .insert(likes)
      .values({ zineId: zine.id, userId: viewer.id })
      .onConflictDoNothing();
  }

  revalidatePath(`/magazine/${zine.handle}/${zine.slug}`);
}

export async function addZineComment(
  zineId: string,
  previousState: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const viewer = await requireCurrentDatabaseUser();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Write a comment before posting." };
  if (body.length > 2000) {
    return { error: "Comments must be 2,000 characters or fewer." };
  }

  const zine = await getEngageableZine(zineId, viewer.id);
  if (!zine) return { error: "This issue is not available." };

  await db.insert(comments).values({
    zineId: zine.id,
    userId: viewer.id,
    body,
  });

  revalidatePath(`/magazine/${zine.handle}/${zine.slug}`);
  return { submissionCount: (previousState.submissionCount ?? 0) + 1 };
}
