import { SignUp } from "@clerk/nextjs";

import { Masthead } from "@/components/editorial/masthead";

export default function SignUpPage() {
  return (
    <main className="editorial-shell">
      <Masthead eyebrow="Make your first issue">Create</Masthead>
      <div className="mx-auto max-w-md border-t border-black pt-5">
        <SignUp />
      </div>
    </main>
  );
}
