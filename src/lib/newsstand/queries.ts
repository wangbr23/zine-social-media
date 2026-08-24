import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { follows, pages, users, zines } from "@/db/schema";

export function getNewsstandZines(userId: string) {
  return db
    .select({
      id: zines.id,
      title: zines.title,
      slug: zines.slug,
      description: zines.description,
      coverImageUrl: zines.coverImageUrl,
      aspectWidth: zines.aspectWidth,
      aspectHeight: zines.aspectHeight,
      publishedAt: zines.publishedAt,
      firstPageBackground: pages.background,
      firstPageBlocks: pages.blocks,
      creatorHandle: users.handle,
      creatorDisplayName: users.displayName,
      creatorAvatarUrl: users.avatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followedUserId))
    .innerJoin(
      zines,
      and(eq(zines.userId, users.id), eq(zines.status, "published")),
    )
    .leftJoin(
      pages,
      and(eq(pages.zineId, zines.id), eq(pages.pageNumber, 1)),
    )
    .where(
      and(
        eq(follows.followerUserId, userId),
        eq(follows.status, "accepted"),
      ),
    )
    .orderBy(desc(zines.publishedAt));
}
