import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BottomNav } from "@/components/editorial/bottom-nav";
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

  return (
    <main className="editorial-shell">
      <div className="mx-auto max-w-6xl">
        <section className="flex items-start gap-4 pt-3">
          <UserButton
            appearance={{
              elements: { avatarBox: "size-20 rounded-none" },
            }}
          />
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="editorial-display truncate text-3xl">
              {user.displayName}
            </h1>
            <p className="editorial-serif mt-1 text-xl">
              {user.bio || "Writing about life, one page at a time."}
            </p>
            <p className="mt-2 text-sm text-[var(--editorial-muted)]">
              @{user.handle}
            </p>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-2 border-b border-[var(--editorial-rule)] text-center text-sm">
          <span className="border-b-2 border-black pb-2">Zines</span>
          <span className="pb-2 text-[var(--editorial-muted)]">Drafts</span>
        </div>

        <section className="py-16 text-center">
          <p className="editorial-display text-3xl">NO ISSUES YET</p>
          <p className="editorial-serif mx-auto mt-2 max-w-md text-lg text-black/65">
            Your published zines will live here. Start with a blank page or a
            template.
          </p>
          <button className="editorial-button mt-5 bg-black px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
            Create a zine
          </button>
        </section>
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
