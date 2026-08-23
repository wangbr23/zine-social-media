"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { users } from "@/db/schema";
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
