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

export type DeleteDraftResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteDraftZine(zineId: string): Promise<DeleteDraftResult> {
  const user = await requireCurrentDatabaseUser();

  try {
    const draftPages = await db
      .select({ blocks: pages.blocks })
      .from(pages)
      .innerJoin(
        zines,
        and(
          eq(pages.zineId, zines.id),
          eq(zines.id, zineId),
          eq(zines.userId, user.id),
          eq(zines.status, "draft"),
        ),
      );
    const [deleted] = await db
      .delete(zines)
      .where(
        and(
          eq(zines.id, zineId),
          eq(zines.userId, user.id),
          eq(zines.status, "draft"),
        ),
      )
      .returning({ id: zines.id, coverImageUrl: zines.coverImageUrl });

    if (!deleted) return { ok: false, error: "Draft not found." };

    after(() => cleanupPageImages({
      candidateUrls: [
        ...draftPages.flatMap(({ blocks }) => imageUrlsFromBlocks(blocks)),
        ...(deleted.coverImageUrl ? [deleted.coverImageUrl] : []),
      ],
      clerkUserId: user.clerkUserId,
    }));

    revalidatePath("/profile");
    revalidatePath(`/magazine/${user.handle}`);
    return { ok: true };
  } catch (error) {
    console.error("Delete draft failed", { zineId, error });
    return { ok: false, error: "Could not delete this draft. Please try again." };
  }
}
