import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BottomNav } from "@/components/editorial/bottom-nav";
import { Masthead } from "@/components/editorial/masthead";
import { db } from "@/db";
import { users, zines } from "@/db/schema";

export default async function DraftReadyPage({ params }: { params: Promise<{ zineId: string }> }) {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return redirectToSignIn();
  }

  const { zineId } = await params;
  const [zine] = await db
    .select({ id: zines.id, title: zines.title, aspectWidth: zines.aspectWidth, aspectHeight: zines.aspectHeight, templateKey: zines.templateKey })
    .from(zines)
    .innerJoin(users, eq(zines.userId, users.id))
    .where(
      and(
        eq(zines.id, zineId),
        eq(users.clerkUserId, userId),
        eq(zines.status, "draft"),
      ),
    )
    .limit(1);

  if (!zine) notFound();

  return (
    <main className="editorial-shell">
      <div className="mx-auto max-w-3xl">
        <Masthead eyebrow="Draft saved">Newsstand</Masthead>
        <section className="editorial-rule pt-8">
          <p className="editorial-eyebrow">Your next issue</p>
          <h2 className="editorial-display break-words text-4xl md:text-6xl">{zine.title}</h2>
          <dl className="mt-8 grid grid-cols-2 border-y border-black py-5 text-sm sm:grid-cols-3">
            <div><dt className="font-bold uppercase text-black/50">Status</dt><dd className="mt-1">Draft</dd></div>
            <div><dt className="font-bold uppercase text-black/50">Shape</dt><dd className="mt-1">{zine.aspectWidth}:{zine.aspectHeight}</dd></div>
            <div><dt className="font-bold uppercase text-black/50">Start</dt><dd className="mt-1 capitalize">{zine.templateKey?.replace("-", " ")}</dd></div>
          </dl>
          <p className="editorial-serif mt-8 text-lg text-black/70">Your draft is ready. The page editor arrives in the next build.</p>
          <Link className="editorial-text-link mt-6 inline-block font-bold" href="/create">Create another issue</Link>
        </section>
      </div>
      <BottomNav active="create" />
    </main>
  );
}
