import type {
  ImageBlock,
  ImageFilter,
  ImageFrame,
  PageBlock,
  ShapeBlock,
  ShapeKind,
  TextBlock,
} from "@/db/schema";
import {
  DEFAULT_FONT_FAMILY,
  type CuratedFontFamily,
} from "@/lib/zines/fonts";

/**
 * Page geometry is authored against a page of this fixed width, never in CSS pixels,
 * so a page renders identically at any displayed size (editor canvas, thumbnail, reader).
 * Positions are already percentages; this is the unit for lengths that percentages can't
 * express, like type size.
 */
export const PAGE_WIDTH_UNITS = 1000;

export const MIN_FONT_SIZE_UNITS = 10;
export const MAX_FONT_SIZE_UNITS = 320;
export const DEFAULT_FONT_SIZE_UNITS = 44;

/**
 * A block may sit past the page edge so art can bleed — the page surface clips whatever
 * falls outside it. These are sanity bounds on a stored frame, not layout rules: roomy
 * enough to hang a block a full page off any edge or run it to three times page size,
 * tight enough that a client can't save a block a million percent wide.
 */
export const MIN_BLOCK_POSITION_PERCENT = -100;
export const MAX_BLOCK_POSITION_PERCENT = 200;
export const MAX_BLOCK_SIZE_PERCENT = 300;

export type PageBlockPatch = Partial<
  Omit<TextBlock, "id" | "type" | "fontFamily">
> &
  Partial<Omit<ImageBlock, "id" | "type">> &
  Partial<Omit<ShapeBlock, "id" | "type">> & {
    fontFamily?: CuratedFontFamily;
  };

export const SHAPE_OPTIONS = [
  { kind: "torn-paper", label: "Torn paper" },
  { kind: "tape", label: "Tape" },
  { kind: "speech-bubble", label: "Speech bubble" },
  { kind: "starburst", label: "Starburst" },
] as const satisfies ReadonlyArray<{ kind: ShapeKind; label: string }>;

export const IMAGE_FRAME_OPTIONS = [
  { value: "none", label: "None" },
  { value: "polaroid", label: "Polaroid" },
  { value: "torn-edge", label: "Torn edge" },
  { value: "circle", label: "Circle" },
] as const satisfies ReadonlyArray<{ value: ImageFrame; label: string }>;

export const IMAGE_FILTER_OPTIONS = [
  { value: "none", label: "Original" },
  { value: "duotone", label: "Duotone" },
  { value: "xerox", label: "Xerox" },
  { value: "riso", label: "Riso" },
] as const satisfies ReadonlyArray<{ value: ImageFilter; label: string }>;

export function isImageFrame(value: unknown): value is ImageFrame {
  return IMAGE_FRAME_OPTIONS.some((option) => option.value === value);
}

export function isImageFilter(value: unknown): value is ImageFilter {
  return IMAGE_FILTER_OPTIONS.some((option) => option.value === value);
}

export function isShapeKind(value: unknown): value is ShapeKind {
  return SHAPE_OPTIONS.some(({ kind }) => kind === value);
}

export function applyPageBlockPatch(
  block: PageBlock,
  patch: PageBlockPatch,
): PageBlock {
  const frame = {
    x: patch.x ?? block.x,
    y: patch.y ?? block.y,
    width: patch.width ?? block.width,
    height: patch.height ?? block.height,
    rotation: patch.rotation ?? block.rotation,
  };

  if (block.type === "text") {
    return {
      ...block,
      ...frame,
      text: patch.text ?? block.text,
      fontFamily: patch.fontFamily ?? block.fontFamily,
      fontSize: patch.fontSize ?? block.fontSize,
      color: patch.color ?? block.color,
      textAlign: patch.textAlign ?? block.textAlign,
    };
  }

  if (block.type === "image") {
    return {
      ...block,
      ...frame,
      url: patch.url ?? block.url,
      alt: patch.alt ?? block.alt,
      objectFit: patch.objectFit ?? block.objectFit,
      frame: patch.frame ?? block.frame,
      filter: patch.filter ?? block.filter,
      filterColors: patch.filterColors ?? block.filterColors,
    };
  }

  return {
    ...block,
    ...frame,
    shape: patch.shape ?? block.shape,
    color: patch.color ?? block.color,
  };
}

/**
 * Converts a page-unit length to a CSS length relative to the rendered page width.
 * Only valid inside the page surface, which `PageRenderer` declares as an inline-size
 * container so `cqw` resolves against the page rather than the viewport.
 */
export function pageUnitsToCss(units: number) {
  return `${(units / PAGE_WIDTH_UNITS) * 100}cqw`;
}

export function createTextBlock(): TextBlock {
  return {
    id: crypto.randomUUID(),
    type: "text",
    x: 10,
    y: 10,
    width: 80,
    height: 20,
    rotation: 0,
    text: "Write something worth keeping.",
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_FONT_SIZE_UNITS,
    color: "#111111",
    textAlign: "left",
  };
}

export function createImageBlock({ alt, url }: { alt: string; url: string }): ImageBlock {
  return {
    id: crypto.randomUUID(),
    type: "image",
    x: 10,
    y: 10,
    width: 80,
    height: 50,
    rotation: 0,
    url,
    alt,
    objectFit: "cover",
    frame: "none",
    filter: "none",
    filterColors: [0, 2],
  };
}

export function createShapeBlock(shape: ShapeKind, color: string): ShapeBlock {
  const wide = shape === "torn-paper" || shape === "tape";
  return {
    id: crypto.randomUUID(),
    type: "shape",
    x: wide ? 15 : 30,
    y: wide ? 20 : 25,
    width: wide ? 70 : 40,
    height: wide ? 16 : 35,
    rotation: shape === "tape" ? -4 : 0,
    shape,
    color,
  };
}
