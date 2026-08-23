import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Masthead } from "@/components/editorial/masthead";
import { findUserByClerkId } from "@/lib/auth/user";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="editorial-shell">
        <Masthead>Newsstand</Masthead>

        <div className="mx-auto max-w-5xl">
          <section className="editorial-rule py-8">
            <p className="editorial-display text-3xl md:text-5xl">
              YOUR ISSUE STARTS HERE
            </p>
            <p className="editorial-serif mt-2 max-w-2xl text-lg md:text-xl">
              Make an account, choose your magazine name, and begin with a blank
              page.
            </p>
            <div className="mt-7 flex items-center gap-5 text-sm">
              <SignUpButton mode="modal">
                <button className="editorial-button bg-[var(--editorial-red)] px-5 py-3 font-bold uppercase tracking-wide text-white">
                  Create account
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="editorial-link editorial-text-link font-bold">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const user = await findUserByClerkId(userId);

  if (!user) {
    redirect("/onboarding");
  }

  redirect("/newsstand");
}
