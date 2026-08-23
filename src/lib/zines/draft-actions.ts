"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { zines } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";

export type DeleteDraftResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteDraftZine(zineId: string): Promise<DeleteDraftResult> {
  const user = await requireCurrentDatabaseUser();

  try {
    const [deleted] = await db
      .delete(zines)
      .where(
        and(
          eq(zines.id, zineId),
          eq(zines.userId, user.id),
          eq(zines.status, "draft"),
        ),
      )
      .returning({ id: zines.id });

    if (!deleted) return { ok: false, error: "Draft not found." };

    revalidatePath("/profile");
    revalidatePath(`/magazine/${user.handle}`);
    return { ok: true };
  } catch (error) {
    console.error("Delete draft failed", { zineId, error });
    return { ok: false, error: "Could not delete this draft. Please try again." };
  }
}
