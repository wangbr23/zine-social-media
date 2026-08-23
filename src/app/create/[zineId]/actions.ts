"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { pages, zines, type PageBackground, type PageBlock } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";

export type EditorPage = { id: string; pageNumber: number; background: PageBackground; blocks: PageBlock[] };
export type EditorResult = { ok: true; page?: EditorPage } | { ok: false; error: string };

async function ownsDraft(zineId: string, userId: string) {
  const [draft] = await db.select({ id: zines.id }).from(zines).where(and(eq(zines.id, zineId), eq(zines.userId, userId), eq(zines.status, "draft"))).limit(1);
  return Boolean(draft);
}

function validBackground(value: unknown): value is PageBackground {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PageBackground>;
  return (item.type === "color" || item.type === "gradient") && typeof item.value === "string" && item.value.length > 0 && item.value.length <= 300;
}

function validBlock(value: unknown): value is PageBlock {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PageBlock>;
  const numbers = [item.x, item.y, item.width, item.height, item.rotation];
  if (typeof item.id !== "string" || !numbers.every((number) => typeof number === "number" && Number.isFinite(number)) || item.x! < 0 || item.y! < 0 || item.width! <= 0 || item.height! <= 0 || item.x! + item.width! > 100 || item.y! + item.height! > 100) return false;
  if (item.type === "text") return typeof item.text === "string" && item.text.length <= 5000 && typeof item.fontFamily === "string" && typeof item.fontSize === "number" && item.fontSize >= 8 && item.fontSize <= 200 && typeof item.color === "string" && ["left", "center", "right"].includes(item.textAlign!);
  if (item.type === "image") return typeof item.url === "string" && item.url.startsWith("https://") && typeof item.alt === "string" && item.alt.length <= 500 && (item.objectFit === "cover" || item.objectFit === "contain");
  return false;
}

export async function addPage(zineId: string): Promise<EditorResult> {
  const user = await requireCurrentDatabaseUser();
  if (!(await ownsDraft(zineId, user.id))) return { ok: false, error: "Draft not found." };
  try {
    const [last] = await db.select({ number: max(pages.pageNumber) }).from(pages).where(eq(pages.zineId, zineId));
    const [page] = await db.insert(pages).values({ zineId, pageNumber: (last?.number ?? 0) + 1 }).returning({ id: pages.id, pageNumber: pages.pageNumber, background: pages.background, blocks: pages.blocks });
    revalidatePath(`/create/${zineId}`);
    return { ok: true, page };
  } catch (error) {
    console.error("Add zine page failed", { zineId, error });
    return { ok: false, error: "Could not add a page. Please try again." };
  }
}

export async function savePage(zineId: string, pageId: string, background: unknown, blocks: unknown): Promise<EditorResult> {
  const user = await requireCurrentDatabaseUser();
  if (!(await ownsDraft(zineId, user.id))) return { ok: false, error: "Draft not found." };
  if (!validBackground(background) || !Array.isArray(blocks) || blocks.length > 100 || !blocks.every(validBlock)) return { ok: false, error: "This page contains invalid editor data." };
  try {
    const [page] = await db.update(pages).set({ background, blocks, updatedAt: new Date() }).where(and(eq(pages.id, pageId), eq(pages.zineId, zineId))).returning({ id: pages.id, pageNumber: pages.pageNumber, background: pages.background, blocks: pages.blocks });
    if (!page) return { ok: false, error: "Page not found." };
    revalidatePath(`/create/${zineId}`);
    return { ok: true, page };
  } catch (error) {
    console.error("Save zine page failed", { zineId, pageId, error });
    return { ok: false, error: "Could not save this page. Please try again." };
  }
}

export async function deletePage(zineId: string, pageId: string): Promise<EditorResult> {
  const user = await requireCurrentDatabaseUser();
  if (!(await ownsDraft(zineId, user.id))) return { ok: false, error: "Draft not found." };
  try {
    const deleted = await db.delete(pages).where(and(eq(pages.id, pageId), eq(pages.zineId, zineId))).returning({ id: pages.id });
    if (!deleted.length) return { ok: false, error: "Page not found." };
    revalidatePath(`/create/${zineId}`);
    return { ok: true };
  } catch (error) {
    console.error("Delete zine page failed", { zineId, pageId, error });
    return { ok: false, error: "Could not delete this page. Please try again." };
  }
}
