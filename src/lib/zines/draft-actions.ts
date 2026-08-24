"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { db } from "@/db";
import { pages, zines } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import {
  cleanupPageImages,
  imageUrlsFromBlocks,
} from "@/lib/zines/blob-lifecycle";

export type DeleteZineResult =
  | { ok: true }
  | { ok: false; error: string };

async function deleteOwnedZine(
  zineId: string,
  status: "draft" | "published",
): Promise<DeleteZineResult> {
  const user = await requireCurrentDatabaseUser();
  const label = status === "draft" ? "draft" : "published zine";

  try {
    const zinePages = await db
      .select({ blocks: pages.blocks })
      .from(pages)
      .innerJoin(
        zines,
        and(
          eq(pages.zineId, zines.id),
          eq(zines.id, zineId),
          eq(zines.userId, user.id),
          eq(zines.status, status),
        ),
      );
    const [deleted] = await db
      .delete(zines)
      .where(
        and(
          eq(zines.id, zineId),
          eq(zines.userId, user.id),
          eq(zines.status, status),
        ),
      )
      .returning({ id: zines.id, coverImageUrl: zines.coverImageUrl });

    if (!deleted) return { ok: false, error: `${label[0].toUpperCase()}${label.slice(1)} not found.` };

    after(() => cleanupPageImages({
      candidateUrls: [
        ...zinePages.flatMap(({ blocks }) => imageUrlsFromBlocks(blocks)),
        ...(deleted.coverImageUrl ? [deleted.coverImageUrl] : []),
      ],
      clerkUserId: user.clerkUserId,
    }));

    revalidatePath("/profile");
    revalidatePath(`/magazine/${user.handle}`);
    return { ok: true };
  } catch (error) {
    console.error("Delete zine failed", { zineId, status, error });
    return { ok: false, error: `Could not delete this ${label}. Please try again.` };
  }
}

export async function deleteDraftZine(zineId: string): Promise<DeleteZineResult> {
  return deleteOwnedZine(zineId, "draft");
}

export async function deletePublishedZine(zineId: string): Promise<DeleteZineResult> {
  return deleteOwnedZine(zineId, "published");
}
