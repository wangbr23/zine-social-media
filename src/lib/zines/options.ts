export const ZINE_ASPECT_RATIOS = [
  {
    key: "portrait",
    label: "Portrait",
    detail: "Classic page",
    width: 3,
    height: 4,
  },
  {
    key: "square",
    label: "Square",
    detail: "Album-like",
    width: 1,
    height: 1,
  },
  {
    key: "landscape",
    label: "Landscape",
    detail: "Wide spread",
    width: 4,
    height: 3,
  },
] as const;

export const ZINE_TEMPLATES = [
  { key: "blank", label: "Blank canvas", detail: "Start with an empty page" },
  {
    key: "dispatch",
    label: "The Dispatch",
    detail: "Headline-led editorial",
  },
  {
    key: "photo-essay",
    label: "Photo Essay",
    detail: "Image-first storytelling",
  },
] as const;

export type ZineAspectRatioKey = (typeof ZINE_ASPECT_RATIOS)[number]["key"];
export type ZineTemplateKey = (typeof ZINE_TEMPLATES)[number]["key"];

export function findAspectRatio(value: string) {
  return ZINE_ASPECT_RATIOS.find((ratio) => ratio.key === value);
}

export function findTemplate(value: string) {
  return ZINE_TEMPLATES.find((template) => template.key === value);
}
