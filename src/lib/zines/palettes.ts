import type { ZinePalette } from "@/db/schema";
import type { ZineTemplateKey } from "@/lib/zines/options";

export const PALETTE_SIZE = 5;

const palettes: Record<ZineTemplateKey, ZinePalette> = {
  blank: ["#111111", "#ffffff", "#ef2d32", "#2455ff", "#f5e9d4"],
  dispatch: ["#111111", "#f4efe4", "#ef2d32", "#333333", "#555555"],
  "photo-essay": ["#1b1b1f", "#332d2e", "#f5f2ec", "#c8c2b6", "#8b8792"],
};

export function paletteForTemplate(templateKey: ZineTemplateKey): ZinePalette {
  return palettes[templateKey];
}

export function isZinePalette(value: unknown): value is ZinePalette {
  return (
    Array.isArray(value) &&
    value.length === PALETTE_SIZE &&
    value.every(
      (color) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color),
    )
  );
}
