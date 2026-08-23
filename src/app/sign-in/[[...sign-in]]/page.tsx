import { SignIn } from "@clerk/nextjs";

import { Masthead } from "@/components/editorial/masthead";

export default function SignInPage() {
  return (
    <main className="editorial-shell">
      <Masthead eyebrow="Welcome back">Newsstand</Masthead>
      <div className="mx-auto max-w-md border-t border-black pt-5">
        <SignIn />
      </div>
    </main>
  );
}
