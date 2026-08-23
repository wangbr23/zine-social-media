import { sql } from "drizzle-orm";

import { db } from "@/db";
import { users, zines } from "@/db/schema";
import {
  findAspectRatio,
  type ZineTemplateKey,
} from "@/lib/zines/options";

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

  // The random suffix keeps readable slugs while making simultaneous creation
  // safe. The bounded retry remains the final guard around the database key.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = `${baseSlug}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
    const result = await db.execute<{ id: string; slug: string }>(sql`
      insert into ${zines} (
        "user_id",
        "title",
        "slug",
        "aspect_width",
        "aspect_height",
        "template_key"
      )
      select
        ${users.id},
        ${input.title},
        ${slug},
        ${input.aspectRatio.width},
        ${input.aspectRatio.height},
        ${input.templateKey}
      from ${users}
      where ${users.clerkUserId} = ${input.clerkUserId}
      on conflict do nothing
      returning "id", "slug"
    `);
    const created = result.rows[0];

    if (created) {
      return created;
    }

  }

  throw new Error("Could not allocate a unique zine slug");
}
