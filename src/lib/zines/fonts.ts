export const CURATED_FONTS = [
  { family: "Georgia", label: "Georgia" },
  { family: "Arial", label: "Arial" },
  { family: "Courier New", label: "Courier New" },
  { family: "Impact", label: "Impact" },
] as const;

export type CuratedFontFamily = (typeof CURATED_FONTS)[number]["family"];

export const DEFAULT_FONT_FAMILY: CuratedFontFamily = "Georgia";

const curatedFontFamilies = new Set<string>(
  CURATED_FONTS.map(({ family }) => family),
);

export function isCuratedFontFamily(value: unknown): value is CuratedFontFamily {
  return typeof value === "string" && curatedFontFamilies.has(value);
}
