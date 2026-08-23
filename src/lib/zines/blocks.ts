import type { ImageBlock, TextBlock } from "@/db/schema";

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
    fontFamily: "Georgia",
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
  };
}
