"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
import { findUserByClerkId } from "@/lib/auth/user";

const HANDLE_PATTERN = /^[a-z0-9_]{3,30}$/;

export type OnboardingState = {
  errors?: {
    displayName?: string;
    handle?: string;
    form?: string;
  };
  values?: {
    displayName: string;
    handle: string;
  };
};

function getPrimaryEmail(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
) {
  return (
    clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress
  );
}

export async function completeOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return { errors: { form: "You must be signed in to continue." } };
  }

  const existingUser = await findUserByClerkId(userId);

  if (existingUser) {
    redirect("/");
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "")
    .trim()
    .toLowerCase();
  const errors: NonNullable<OnboardingState["errors"]> = {};

  if (displayName.length < 1 || displayName.length > 80) {
    errors.displayName = "Display name must be between 1 and 80 characters.";
  }

  if (!HANDLE_PATTERN.test(handle)) {
    errors.handle =
      "Handle must be 3–30 characters using lowercase letters, numbers, or underscores.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values: { displayName, handle } };
  }

  const [handleOwner] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);

  if (handleOwner) {
    return {
      errors: { handle: "That handle is already taken." },
      values: { displayName, handle },
    };
  }

  const clerkUser = await currentUser();
  const email = clerkUser ? getPrimaryEmail(clerkUser) : null;

  if (!clerkUser || !email) {
    return {
      errors: {
        form: "We could not read a verified email from your Clerk account.",
      },
      values: { displayName, handle },
    };
  }

  try {
    const [createdUser] = await db
      .insert(users)
      .values({
        clerkUserId: userId,
        email: email.toLowerCase(),
        handle,
        displayName,
        avatarUrl: clerkUser.imageUrl || null,
      })
      .onConflictDoNothing()
      .returning({ id: users.id });

    if (!createdUser) {
      const concurrentUser = await findUserByClerkId(userId);

      if (!concurrentUser) {
        return {
          errors: { handle: "That handle was just claimed. Try another." },
          values: { displayName, handle },
        };
      }
    }
  } catch {
    return {
      errors: { form: "We could not create your profile. Please try again." },
      values: { displayName, handle },
    };
  }

  redirect("/");
}
