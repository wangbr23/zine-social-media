"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { db } from "@/db";
import { pages, zines, type PageBackground, type PageBlock } from "@/db/schema";
import { requireCurrentDatabaseUser } from "@/lib/auth/user";
import {
  MAX_BLOCK_POSITION_PERCENT,
  MAX_BLOCK_SIZE_PERCENT,
  MAX_FONT_SIZE_UNITS,
  MIN_BLOCK_POSITION_PERCENT,
  MIN_FONT_SIZE_UNITS,
  isImageFilter,
  isImageFrame,
  isShapeKind,
} from "@/lib/zines/blocks";
import { isCuratedFontFamily } from "@/lib/zines/fonts";
import {
  cleanupPageImages,
  imageUrlsFromBlocks,
} from "@/lib/zines/blob-lifecycle";
import { isZinePalette } from "@/lib/zines/palettes";

export type EditorPage = { id: string; pageNumber: number; background: PageBackground; blocks: PageBlock[] };
export type EditorResult =
  | { ok: true; page: EditorPage }
  | { ok: false; error: string };
export type DeletePageResult = { ok: true } | { ok: false; error: string };
export type PublishZineResult = { ok: true } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function validBackground(value: unknown): value is PageBackground {
  if (!isRecord(value)) return false;
  const item = value;
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
function validFrame(item: Record<string, unknown>) {
  const { x, y, width, height, rotation } = item;
  if (
    !isNumber(x) ||
    !isNumber(y) ||
    !isNumber(width) ||
    !isNumber(height) ||
    !isNumber(rotation)
  ) {
    return false;
  }
  return (
    x >= MIN_BLOCK_POSITION_PERCENT &&
    x <= MAX_BLOCK_POSITION_PERCENT &&
    y >= MIN_BLOCK_POSITION_PERCENT &&
    y <= MAX_BLOCK_POSITION_PERCENT &&
    width > 0 &&
    width <= MAX_BLOCK_SIZE_PERCENT &&
    height > 0 &&
    height <= MAX_BLOCK_SIZE_PERCENT
  );
}

function validBlock(value: unknown): value is PageBlock {
  if (!isRecord(value)) return false;
  const item = value;
  if (typeof item.id !== "string" || !validFrame(item)) return false;
  if (item.type === "text") return typeof item.text === "string" && item.text.length <= 5000 && isCuratedFontFamily(item.fontFamily) && typeof item.fontSize === "number" && item.fontSize >= MIN_FONT_SIZE_UNITS && item.fontSize <= MAX_FONT_SIZE_UNITS && typeof item.color === "string" && (item.textAlign === "left" || item.textAlign === "center" || item.textAlign === "right");
  if (item.type === "image") {
    const validColors = item.filterColors === undefined || (
      Array.isArray(item.filterColors) &&
      item.filterColors.length === 2 &&
      item.filterColors.every((index) => Number.isInteger(index) && index >= 0 && index < 5)
    );
    return typeof item.url === "string" && item.url.startsWith("https://") &&
      typeof item.alt === "string" && item.alt.length <= 500 &&
      (item.objectFit === "cover" || item.objectFit === "contain") &&
      (item.frame === undefined || isImageFrame(item.frame)) &&
      (item.filter === undefined || isImageFilter(item.filter)) && validColors;
  }
  if (item.type === "shape") return isShapeKind(item.shape) && typeof item.color === "string" && item.color.length > 0 && item.color.length <= 100;
  return false;
}

export async function addPage(zineId: string): Promise<EditorResult> {
  const user = await requireCurrentDatabaseUser();
  try {
    const result = await db.execute<EditorPage>(sql`
      with editable_zine as (
        update ${zines}
        set "updated_at" = now()
        where
          ${zines.id} = ${zineId}
          and ${zines.userId} = ${user.id}
          and ${zines.status} = 'draft'
        returning "id"
      )
      insert into ${pages} ("zine_id", "page_number")
      select
        editable_zine."id",
        coalesce(max(${pages.pageNumber}), 0) + 1
      from editable_zine
      left join ${pages} on ${pages.zineId} = editable_zine."id"
      group by editable_zine."id"
      returning
        "id",
        "page_number" as "pageNumber",
        "background",
        "blocks"
    `);
    const page = result.rows[0];
    if (!page) return { ok: false, error: "Draft not found." };
    revalidatePath(`/create/${zineId}`);
    return { ok: true, page };
  } catch (error) {
    console.error("Add zine page failed", { zineId, error });
    return { ok: false, error: "Could not add a page. Please try again." };
  }
}

export async function savePage(zineId: string, pageId: string, background: unknown, blocks: unknown): Promise<EditorResult> {
  const user = await requireCurrentDatabaseUser();
  if (!validBackground(background) || !Array.isArray(blocks) || blocks.length > 100 || !blocks.every(validBlock)) return { ok: false, error: "This page contains invalid editor data." };
  try {
    const result = await db.execute<EditorPage & { previousBlocks: PageBlock[] }>(sql`
      with editable_zine as (
        update ${zines}
        set "updated_at" = now()
        where
          ${zines.id} = ${zineId}
          and ${zines.userId} = ${user.id}
          and ${zines.status} = 'draft'
        returning "id"
      ),
      target_page as materialized (
        select ${pages.id}, ${pages.blocks}
        from ${pages}
        inner join editable_zine on ${pages.zineId} = editable_zine."id"
        where ${pages.id} = ${pageId}
        for update
      ),
      updated_page as (
        update ${pages}
        set
          "background" = ${JSON.stringify(background)}::jsonb,
          "blocks" = ${JSON.stringify(blocks)}::jsonb,
          "updated_at" = now()
        from target_page
        where ${pages.id} = target_page."id"
        returning
          ${pages.id} as "id",
          ${pages.pageNumber} as "pageNumber",
          ${pages.background} as "background",
          ${pages.blocks} as "blocks"
      )
      select
        updated_page.*,
        target_page."blocks" as "previousBlocks"
      from updated_page
      inner join target_page on target_page."id" = updated_page."id"
    `);
    const page = result.rows[0];
    if (!page) return { ok: false, error: "Draft or page not found." };
    const savedUrls = new Set(imageUrlsFromBlocks(blocks));
    const removedUrls = imageUrlsFromBlocks(page.previousBlocks).filter(
      (url) => !savedUrls.has(url),
    );
    after(() => cleanupPageImages({ candidateUrls: removedUrls, clerkUserId: user.clerkUserId }));
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
  if (!isZinePalette(palette)) {
    return { ok: false, error: "This image did not produce a valid palette." };
  }
  try {
    const updated = await db
      .update(zines)
      .set({ palette, updatedAt: new Date() })
      .where(
        and(
          eq(zines.id, zineId),
          eq(zines.userId, user.id),
          eq(zines.status, "draft"),
        ),
      )
      .returning({ id: zines.id });
    if (!updated.length) return { ok: false, error: "Draft not found." };
    return { ok: true };
  } catch (error) {
    console.error("Save zine palette failed", { zineId, error });
    return { ok: false, error: "Could not save the sampled palette." };
  }
}

export async function deletePage(
  zineId: string,
  pageId: string,
): Promise<DeletePageResult> {
  const user = await requireCurrentDatabaseUser();
  try {
    const result = await db.execute<{ id: string; blocks: PageBlock[] }>(sql`
      with editable_zine as (
        update ${zines}
        set "updated_at" = now()
        where
          ${zines.id} = ${zineId}
          and ${zines.userId} = ${user.id}
          and ${zines.status} = 'draft'
        returning "id"
      )
      delete from ${pages}
      using editable_zine
      where
        ${pages.id} = ${pageId}
        and ${pages.zineId} = editable_zine."id"
      returning ${pages.id} as "id", ${pages.blocks} as "blocks"
    `);
    if (!result.rows.length) return { ok: false, error: "Draft or page not found." };
    after(() => cleanupPageImages({
      candidateUrls: imageUrlsFromBlocks(result.rows[0].blocks),
      clerkUserId: user.clerkUserId,
    }));
    revalidatePath(`/create/${zineId}`);
    return { ok: true };
  } catch (error) {
    console.error("Delete zine page failed", { zineId, pageId, error });
    return { ok: false, error: "Could not delete this page. Please try again." };
  }
}

export async function publishZine(zineId: string): Promise<PublishZineResult> {
  const user = await requireCurrentDatabaseUser();

  try {
    const result = await db.execute<{ id: string }>(sql`
      update ${zines}
      set
        "status" = 'published',
        "published_at" = now(),
        "updated_at" = now()
      where
        ${zines.id} = ${zineId}
        and ${zines.userId} = ${user.id}
        and ${zines.status} = 'draft'
        and exists (
          select 1
          from ${pages}
          where ${pages.zineId} = ${zines.id}
        )
      returning ${zines.id} as "id"
    `);

    if (!result.rows.length) {
      return {
        ok: false,
        error: "This draft could not be published. Add and save at least one page, then try again.",
      };
    }

    revalidatePath("/profile");
    revalidatePath(`/magazine/${user.handle}`);
    revalidatePath(`/create/${zineId}`);
    return { ok: true };
  } catch (error) {
    console.error("Publish zine failed", { zineId, error });
    return { ok: false, error: "Could not publish this zine. Please try again." };
  }
}
