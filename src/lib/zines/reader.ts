import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { pages, zines } from "@/db/schema";

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
