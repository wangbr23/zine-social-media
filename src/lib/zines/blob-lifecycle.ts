import "server-only";

import { del, list } from "@vercel/blob";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { pages, zines, type PageBlock } from "@/db/schema";

const ABANDONED_UPLOAD_GRACE_MS = 24 * 60 * 60 * 1000;

export function imageUrlsFromBlocks(blocks: PageBlock[]) {
  return blocks
    .filter((block) => block.type === "image")
    .map((block) => block.url);
}

function isOwnedPageImageUrl(url: string, clerkUserId: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".blob.vercel-storage.com") &&
      parsed.pathname.startsWith(`/zine-pages/${clerkUserId}/`)
    );
  } catch {
    return false;
  }
}

async function abandonedUploads(clerkUserId: string) {
  const cutoff = Date.now() - ABANDONED_UPLOAD_GRACE_MS;
  const urls: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: `zine-pages/${clerkUserId}/`,
      cursor,
      limit: 1000,
    });
    urls.push(
      ...result.blobs
        .filter(({ uploadedAt }) => uploadedAt.getTime() <= cutoff)
        .map(({ url }) => url),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return urls;
}

async function referencedImageUrls() {
  const result = await db.execute<{ url: string }>(sql`
    select distinct referenced."url"
    from (
      select block ->> 'url' as "url"
      from ${pages}
      cross join lateral jsonb_array_elements(${pages.blocks}) as block
      where block ->> 'type' = 'image'

      union all

      select ${zines.coverImageUrl} as "url"
      from ${zines}
      where ${zines.coverImageUrl} is not null
    ) as referenced
  `);

  return new Set(result.rows.map(({ url }) => url));
}

/**
 * Best-effort cleanup after the database mutation has committed. Every candidate
 * is checked against all surviving pages immediately before deletion, so a URL
 * reused by another page or zine is retained. Failures are logged per URL and do
 * not turn a successful editor mutation into a misleading error response.
 */
export async function cleanupPageImages({
  candidateUrls = [],
  clerkUserId,
}: {
  candidateUrls?: string[];
  clerkUserId: string;
}) {
  try {
    const abandoned = await abandonedUploads(clerkUserId);
    const candidates = [
      ...new Set([...candidateUrls, ...abandoned]),
    ].filter((url) => isOwnedPageImageUrl(url, clerkUserId));
    if (!candidates.length) return;

    const referenced = await referencedImageUrls();
    const deletions = candidates
      .filter((url) => !referenced.has(url))
      .map(async (url) => {
        try {
          await del(url);
        } catch (error) {
          console.error("Page image Blob cleanup failed", { url, error });
        }
      });
    await Promise.all(deletions);
  } catch (error) {
    console.error("Page image Blob sweep failed", { clerkUserId, error });
  }
}
