import { BottomNav } from "@/components/editorial/bottom-nav";
import { Masthead } from "@/components/editorial/masthead";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";

import { CreateZineForm } from "./create-zine-form";

export default async function CreatePage() {
  await requireCurrentDatabaseUser();

  return (
    <main className="editorial-shell">
      <div className="mx-auto max-w-5xl">
        <Masthead eyebrow="Make an issue">Newsstand</Masthead>
        <section className="editorial-rule pt-8">
          <p className="editorial-eyebrow">New draft · Step 01</p>
          <h2 className="editorial-display text-4xl md:text-6xl">SET THE FORMAT</h2>
          <p className="editorial-serif mt-3 max-w-2xl text-lg leading-snug text-black/70">
            Give the issue a name, choose its proportions, and pick a place to begin. You can fill the pages next.
          </p>
          <CreateZineForm />
        </section>
      </div>
      <BottomNav active="create" />
    </main>
  );
}
