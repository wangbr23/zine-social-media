ALTER TABLE "zines" ADD COLUMN "palette" jsonb DEFAULT '["#111111","#ffffff","#ef2d32","#2455ff","#f5e9d4"]'::jsonb NOT NULL;
--> statement-breakpoint
UPDATE "zines"
SET "palette" = CASE "template_key"
  WHEN 'dispatch' THEN '["#111111","#f4efe4","#ef2d32","#333333","#555555"]'::jsonb
  WHEN 'photo-essay' THEN '["#1b1b1f","#332d2e","#f5f2ec","#c8c2b6","#8b8792"]'::jsonb
  ELSE "palette"
END;
