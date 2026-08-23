import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const profileVisibility = pgEnum("profile_visibility", [
  "public",
  "private",
]);

export const zineStatus = pgEnum("zine_status", ["draft", "published"]);

export const followStatus = pgEnum("follow_status", [
  "pending",
  "accepted",
]);

export type PageBackground = {
  type: "color" | "gradient";
  value: string;
};

export type ZinePalette = [string, string, string, string, string];

export type TextBlock = {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  textAlign: "left" | "center" | "right";
};

export type ImageBlock = {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  url: string;
  alt: string;
  objectFit: "cover" | "contain";
};

export type PageBlock = TextBlock | ImageBlock;

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    handle: text("handle").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    visibility: profileVisibility("visibility").default("public").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_clerk_user_id_unique").on(table.clerkUserId),
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_handle_unique").on(table.handle),
    check(
      "users_handle_format",
      sql`${table.handle} ~ '^[a-z0-9_]{3,30}$'`,
    ),
    check(
      "users_display_name_length",
      sql`char_length(${table.displayName}) between 1 and 80`,
    ),
    check(
      "users_bio_length",
      sql`${table.bio} is null or char_length(${table.bio}) <= 500`,
    ),
  ],
);

export const zines = pgTable(
  "zines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    status: zineStatus("status").default("draft").notNull(),
    aspectWidth: integer("aspect_width").notNull(),
    aspectHeight: integer("aspect_height").notNull(),
    templateKey: text("template_key"),
    palette: jsonb("palette")
      .$type<ZinePalette>()
      .notNull()
      .default(["#111111", "#ffffff", "#ef2d32", "#2455ff", "#f5e9d4"]),
    coverImageUrl: text("cover_image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("zines_user_slug_unique").on(
      table.userId,
      table.slug,
    ),
    index("zines_user_status_updated_idx").on(
      table.userId,
      table.status,
      table.updatedAt,
    ),
    index("zines_published_feed_idx").on(table.status, table.publishedAt),
    check(
      "zines_title_length",
      sql`char_length(${table.title}) between 1 and 120`,
    ),
    check(
      "zines_description_length",
      sql`${table.description} is null or char_length(${table.description}) <= 1000`,
    ),
    check(
      "zines_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
    check(
      "zines_positive_aspect_ratio",
      sql`${table.aspectWidth} > 0 and ${table.aspectHeight} > 0`,
    ),
    check(
      "zines_publish_state",
      sql`(${table.status} = 'draft' and ${table.publishedAt} is null) or (${table.status} = 'published' and ${table.publishedAt} is not null)`,
    ),
  ],
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zineId: uuid("zine_id")
      .notNull()
      .references(() => zines.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    background: jsonb("background")
      .$type<PageBackground>()
      .notNull()
      .default({ type: "color", value: "#ffffff" }),
    blocks: jsonb("blocks").$type<PageBlock[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pages_zine_page_number_unique").on(
      table.zineId,
      table.pageNumber,
    ),
    check("pages_page_number_positive", sql`${table.pageNumber} > 0`),
    check("pages_blocks_array", sql`jsonb_typeof(${table.blocks}) = 'array'`),
    check(
      "pages_background_object",
      sql`jsonb_typeof(${table.background}) = 'object'`,
    ),
  ],
);

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerUserId: uuid("follower_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followedUserId: uuid("followed_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: followStatus("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("follows_pair_unique").on(
      table.followerUserId,
      table.followedUserId,
    ),
    index("follows_followed_status_idx").on(
      table.followedUserId,
      table.status,
    ),
    index("follows_follower_status_idx").on(
      table.followerUserId,
      table.status,
    ),
    check(
      "follows_not_self",
      sql`${table.followerUserId} <> ${table.followedUserId}`,
    ),
    check(
      "follows_acceptance_state",
      sql`(${table.status} = 'pending' and ${table.acceptedAt} is null) or (${table.status} = 'accepted' and ${table.acceptedAt} is not null)`,
    ),
  ],
);

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zineId: uuid("zine_id")
      .notNull()
      .references(() => zines.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("likes_zine_user_unique").on(
      table.zineId,
      table.userId,
    ),
    index("likes_zine_created_idx").on(table.zineId, table.createdAt),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zineId: uuid("zine_id")
      .notNull()
      .references(() => zines.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("comments_zine_created_idx").on(table.zineId, table.createdAt),
    check(
      "comments_body_length",
      sql`char_length(${table.body}) between 1 and 2000`,
    ),
  ],
);
