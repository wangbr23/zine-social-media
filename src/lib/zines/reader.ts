import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { comments, likes, pages, users, zines } from "@/db/schema";

export async function getPublishedZineForReader(
  userId: string,
  slug: string,
) {
  const [zine] = await db
    .select({
      id: zines.id,
      title: zines.title,
      description: zines.description,
      aspectWidth: zines.aspectWidth,
      aspectHeight: zines.aspectHeight,
      publishedAt: zines.publishedAt,
      palette: zines.palette,
    })
    .from(zines)
    .where(
      and(
        eq(zines.userId, userId),
        eq(zines.slug, slug),
        eq(zines.status, "published"),
      ),
    )
    .limit(1);

  if (!zine) return null;

  const zinePages = await db
    .select({
      id: pages.id,
      pageNumber: pages.pageNumber,
      background: pages.background,
      blocks: pages.blocks,
    })
    .from(pages)
    .where(eq(pages.zineId, zine.id))
    .orderBy(asc(pages.pageNumber));

  if (!zinePages.length) return null;

  return { ...zine, pages: zinePages };
}

export async function getZineEngagement(zineId: string, viewerId?: string) {
  const [[likeCount], zineComments, viewerLike] = await Promise.all([
    db.select({ value: count() }).from(likes).where(eq(likes.zineId, zineId)),
    db
      .select({
        id: comments.id,
        body: comments.body,
        createdAt: comments.createdAt,
        displayName: users.displayName,
        handle: users.handle,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(eq(comments.zineId, zineId))
      .orderBy(asc(comments.createdAt)),
    viewerId
      ? db
          .select({ id: likes.id })
          .from(likes)
          .where(and(eq(likes.zineId, zineId), eq(likes.userId, viewerId)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    comments: zineComments,
    likeCount: likeCount.value,
    viewerHasLiked: viewerLike.length > 0,
  };
}
