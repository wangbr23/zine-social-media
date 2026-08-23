"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { pages, zines, type PageBackground, type PageBlock } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import {
  MAX_BLOCK_POSITION_PERCENT,
  MAX_BLOCK_SIZE_PERCENT,
  MAX_FONT_SIZE_UNITS,
  MIN_BLOCK_POSITION_PERCENT,
  MIN_FONT_SIZE_UNITS,
} from "@/lib/zines/blocks";
import { isZinePalette } from "@/lib/zines/palettes";

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

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * A frame is allowed to extend past the page edge — that's how a full bleed is authored,
 * and `PageRenderer` clips the overflow — so this only rejects frames far enough outside
 * the page to be nonsense rather than art.
 */
function validFrame(item: Partial<PageBlock>) {
  const positions = [item.x, item.y];
  const sizes = [item.width, item.height];
  if (![...positions, ...sizes, item.rotation].every(isNumber)) return false;
  return (
    positions.every(
      (value) =>
        value! >= MIN_BLOCK_POSITION_PERCENT &&
        value! <= MAX_BLOCK_POSITION_PERCENT,
    ) && sizes.every((value) => value! > 0 && value! <= MAX_BLOCK_SIZE_PERCENT)
  );
}

function validBlock(value: unknown): value is PageBlock {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PageBlock>;
  if (typeof item.id !== "string" || !validFrame(item)) return false;
  if (item.type === "text") return typeof item.text === "string" && item.text.length <= 5000 && typeof item.fontFamily === "string" && typeof item.fontSize === "number" && item.fontSize >= MIN_FONT_SIZE_UNITS && item.fontSize <= MAX_FONT_SIZE_UNITS && typeof item.color === "string" && ["left", "center", "right"].includes(item.textAlign!);
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

export async function savePalette(
  zineId: string,
  palette: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireCurrentDatabaseUser();
  if (!(await ownsDraft(zineId, user.id))) {
    return { ok: false, error: "Draft not found." };
  }
  if (!isZinePalette(palette)) {
    return { ok: false, error: "This image did not produce a valid palette." };
  }
  try {
    await db
      .update(zines)
      .set({ palette, updatedAt: new Date() })
      .where(and(eq(zines.id, zineId), eq(zines.userId, user.id)));
    return { ok: true };
  } catch (error) {
    console.error("Save zine palette failed", { zineId, error });
    return { ok: false, error: "Could not save the sampled palette." };
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
