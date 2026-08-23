import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";

export type DatabaseUser = typeof users.$inferSelect;

export async function findUserByClerkId(clerkUserId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return user ?? null;
}

export async function getCurrentDatabaseUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return findUserByClerkId(userId);
}

export async function requireCurrentDatabaseUser() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return redirectToSignIn();
  }

  const user = await findUserByClerkId(userId);

  if (!user) {
    redirect("/onboarding");
  }

  return user;
}
