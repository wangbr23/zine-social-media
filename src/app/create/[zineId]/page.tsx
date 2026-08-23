import { auth } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { pages, users, zines } from "@/db/schema";

import { ZineEditor } from "./zine-editor";

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

  const zinePages = await db.select({ id: pages.id, pageNumber: pages.pageNumber, background: pages.background, blocks: pages.blocks }).from(pages).where(eq(pages.zineId, zine.id)).orderBy(asc(pages.pageNumber));

  return <ZineEditor clerkUserId={userId} initialPages={zinePages} zine={zine} />;
}
