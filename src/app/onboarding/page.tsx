import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Masthead } from "@/components/editorial/masthead";
import { findUserByClerkId } from "@/lib/auth/user";

import { OnboardingForm } from "./onboarding-form";

function suggestedHandle(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
) {
  const source =
    clerkUser.username ??
    clerkUser.firstName ??
    clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] ??
    "";

  return source
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

export default async function OnboardingPage() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return redirectToSignIn({ returnBackUrl: "/onboarding" });
  }

  const existingUser = await findUserByClerkId(userId);

  if (existingUser) {
    redirect("/");
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const displayName =
    clerkUser.fullName ??
    clerkUser.username ??
    clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] ??
    "";

  return (
    <main className="editorial-shell">
      <Masthead eyebrow="One last step">Profile</Masthead>
      <section className="mx-auto max-w-xl border-t border-black pt-5">
        <h2 className="editorial-display text-3xl">NAME YOUR MAGAZINE</h2>
        <p className="editorial-serif mt-2 text-lg leading-snug text-black/70">
          This is the public identity people will see on your zines, comments,
          and follows.
        </p>
        <OnboardingForm
          defaultDisplayName={displayName}
          defaultHandle={suggestedHandle(clerkUser)}
        />
      </section>
    </main>
  );
}
