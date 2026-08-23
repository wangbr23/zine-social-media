import { sql } from "drizzle-orm";

import { db } from "@/db";
import { pages, users, zines } from "@/db/schema";
import {
  findAspectRatio,
  type ZineTemplateKey,
} from "@/lib/zines/options";
import { firstPageForTemplate } from "@/lib/zines/templates";
import { paletteForTemplate } from "@/lib/zines/palettes";

function slugifyTitle(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");

  return slug || "untitled";
}

export async function createDraftZine(input: {
  clerkUserId: string;
  title: string;
  aspectRatio: NonNullable<ReturnType<typeof findAspectRatio>>;
  templateKey: ZineTemplateKey;
}) {
  const baseSlug = slugifyTitle(input.title);
  const firstPage = firstPageForTemplate(
    input.templateKey,
    input.aspectRatio.width,
    input.aspectRatio.height,
  );
  const palette = paletteForTemplate(input.templateKey);
  // Seeding page 1 inside the same statement keeps a templated draft from ever
  // existing without its opening page. A data-modifying CTE runs even though the
  // outer query never selects from it, and inserts nothing when the zine insert
  // conflicted and returned no row.
  const seedFirstPage = firstPage
    ? sql`, seeded_page as (
        insert into ${pages} ("zine_id", "page_number", "background", "blocks")
        select
          "id",
          1,
          ${JSON.stringify(firstPage.background)}::jsonb,
          ${JSON.stringify(firstPage.blocks)}::jsonb
        from new_zine
      )`
    : sql``;

  // The random suffix keeps readable slugs while making simultaneous creation
  // safe. The bounded retry remains the final guard around the database key.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = `${baseSlug}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
    const result = await db.execute<{ id: string; slug: string }>(sql`
      with new_zine as (
        insert into ${zines} (
          "user_id",
          "title",
          "slug",
          "aspect_width",
          "aspect_height",
          "template_key",
          "palette"
        )
        select
          ${users.id},
          ${input.title},
          ${slug},
          ${input.aspectRatio.width},
          ${input.aspectRatio.height},
          ${input.templateKey},
          ${JSON.stringify(palette)}::jsonb
        from ${users}
        where ${users.clerkUserId} = ${input.clerkUserId}
        on conflict do nothing
        returning "id", "slug"
      )${seedFirstPage}
      select "id", "slug" from new_zine
    `);
    const created = result.rows[0];

    if (created) {
      return created;
    }

  }

  throw new Error("Could not allocate a unique zine slug");
}
