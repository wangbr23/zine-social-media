"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { comments, likes, users, zines } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import { canViewPrivateProfile } from "@/lib/profile/queries";

export type CommentState = { error?: string; submissionCount?: number };
export type DeleteCommentResult = { ok: true } | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateCommentBody(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Write a comment before posting." } as const;
  if (body.length > 2000) {
    return { error: "Comments must be 2,000 characters or fewer." } as const;
  }

  return { body } as const;
}

async function getEngageableZine(zineId: string, viewerId: string) {
  if (!UUID_PATTERN.test(zineId)) {
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
  const comment = validateCommentBody(formData);
  if ("error" in comment) return comment;

  const zine = await getEngageableZine(zineId, viewer.id);
  if (!zine) return { error: "This issue is not available." };

  await db.insert(comments).values({
    zineId: zine.id,
    userId: viewer.id,
    body: comment.body,
  });

  revalidatePath(`/magazine/${zine.handle}/${zine.slug}`);
  return { submissionCount: (previousState.submissionCount ?? 0) + 1 };
}

export async function editZineComment(
  zineId: string,
  commentId: string,
  previousState: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const viewer = await requireCurrentDatabaseUser();
  if (!UUID_PATTERN.test(commentId)) {
    return { error: "You can only edit your own comments." };
  }
  const comment = validateCommentBody(formData);
  if ("error" in comment) return comment;

  const zine = await getEngageableZine(zineId, viewer.id);
  if (!zine) return { error: "This issue is not available." };

  const [updated] = await db
    .update(comments)
    .set({ body: comment.body, updatedAt: new Date() })
    .where(and(eq(comments.id, commentId), eq(comments.zineId, zine.id), eq(comments.userId, viewer.id)))
    .returning({ id: comments.id });

  if (!updated) return { error: "You can only edit your own comments." };

  revalidatePath(`/magazine/${zine.handle}/${zine.slug}`);
  return { submissionCount: (previousState.submissionCount ?? 0) + 1 };
}

export async function deleteZineComment(
  zineId: string,
  commentId: string,
): Promise<DeleteCommentResult> {
  const viewer = await requireCurrentDatabaseUser();
  if (!UUID_PATTERN.test(commentId)) {
    return { ok: false, error: "You can only delete your own comments." };
  }
  const zine = await getEngageableZine(zineId, viewer.id);
  if (!zine) return { ok: false, error: "This issue is not available." };

  const [deleted] = await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.zineId, zine.id), eq(comments.userId, viewer.id)))
    .returning({ id: comments.id });

  if (!deleted) {
    return { ok: false, error: "You can only delete your own comments." };
  }

  revalidatePath(`/magazine/${zine.handle}/${zine.slug}`);
  return { ok: true };
}
