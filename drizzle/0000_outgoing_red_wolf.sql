CREATE TYPE "public"."follow_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."zine_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zine_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_body_length" CHECK (char_length("comments"."body") between 1 and 2000)
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_user_id" uuid NOT NULL,
	"followed_user_id" uuid NOT NULL,
	"status" "follow_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "follows_not_self" CHECK ("follows"."follower_user_id" <> "follows"."followed_user_id"),
	CONSTRAINT "follows_acceptance_state" CHECK (("follows"."status" = 'pending' and "follows"."accepted_at" is null) or ("follows"."status" = 'accepted' and "follows"."accepted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zine_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zine_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"background" jsonb DEFAULT '{"type":"color","value":"#ffffff"}'::jsonb NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_page_number_positive" CHECK ("pages"."page_number" > 0),
	CONSTRAINT "pages_blocks_array" CHECK (jsonb_typeof("pages"."blocks") = 'array'),
	CONSTRAINT "pages_background_object" CHECK (jsonb_typeof("pages"."background") = 'object')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"visibility" "profile_visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_handle_format" CHECK ("users"."handle" ~ '^[a-z0-9_]{3,30}$'),
	CONSTRAINT "users_display_name_length" CHECK (char_length("users"."display_name") between 1 and 80),
	CONSTRAINT "users_bio_length" CHECK ("users"."bio" is null or char_length("users"."bio") <= 500)
);
--> statement-breakpoint
CREATE TABLE "zines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"status" "zine_status" DEFAULT 'draft' NOT NULL,
	"aspect_width" integer NOT NULL,
	"aspect_height" integer NOT NULL,
	"template_key" text,
	"cover_image_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zines_title_length" CHECK (char_length("zines"."title") between 1 and 120),
	CONSTRAINT "zines_description_length" CHECK ("zines"."description" is null or char_length("zines"."description") <= 1000),
	CONSTRAINT "zines_slug_format" CHECK ("zines"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "zines_positive_aspect_ratio" CHECK ("zines"."aspect_width" > 0 and "zines"."aspect_height" > 0),
	CONSTRAINT "zines_publish_state" CHECK (("zines"."status" = 'draft' and "zines"."published_at" is null) or ("zines"."status" = 'published' and "zines"."published_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_zine_id_zines_id_fk" FOREIGN KEY ("zine_id") REFERENCES "public"."zines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_user_id_users_id_fk" FOREIGN KEY ("follower_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followed_user_id_users_id_fk" FOREIGN KEY ("followed_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_zine_id_zines_id_fk" FOREIGN KEY ("zine_id") REFERENCES "public"."zines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_zine_id_zines_id_fk" FOREIGN KEY ("zine_id") REFERENCES "public"."zines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zines" ADD CONSTRAINT "zines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_zine_created_idx" ON "comments" USING btree ("zine_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_pair_unique" ON "follows" USING btree ("follower_user_id","followed_user_id");--> statement-breakpoint
CREATE INDEX "follows_followed_status_idx" ON "follows" USING btree ("followed_user_id","status");--> statement-breakpoint
CREATE INDEX "follows_follower_status_idx" ON "follows" USING btree ("follower_user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "likes_zine_user_unique" ON "likes" USING btree ("zine_id","user_id");--> statement-breakpoint
CREATE INDEX "likes_zine_created_idx" ON "likes" USING btree ("zine_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_zine_page_number_unique" ON "pages" USING btree ("zine_id","page_number");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_unique" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_unique" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "zines_user_slug_unique" ON "zines" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "zines_user_status_updated_idx" ON "zines" USING btree ("user_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "zines_published_feed_idx" ON "zines" USING btree ("status","published_at");