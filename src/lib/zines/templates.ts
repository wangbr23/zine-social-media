import type { PageBackground, PageBlock, TextBlock } from "@/db/schema";
import {
  createTextBlock,
  DEFAULT_FONT_SIZE_UNITS,
  MAX_FONT_SIZE_UNITS,
  MIN_FONT_SIZE_UNITS,
  PAGE_WIDTH_UNITS,
} from "@/lib/zines/blocks";
import type { CuratedFontFamily } from "@/lib/zines/fonts";
import type { ZineTemplateKey } from "@/lib/zines/options";

export type TemplatePage = {
  background: PageBackground;
  blocks: PageBlock[];
};

/**
 * Templates seed text and background only. `ImageBlock.url` has no empty state —
 * the server validator requires an `https://` URL — and inventing one would 404,
 * so the opening photograph is left to the editor's "+ Image" tool.
 */
type TextSpec = {
  text: string;
  /** Page-unit font size as a multiple of the editor's default text size. */
  fontScale: number;
  /** From the editor's curated font catalog. */
  fontFamily: CuratedFontFamily;
  color: string;
  /** Expected wrapped line count, used to reserve vertical room in the frame. */
  lines: number;
  textAlign?: TextBlock["textAlign"];
  /** Blank page-height percentage left above this block. */
  gapBefore?: number;
};

/** Page margin, as a percentage of page width, that template content sits inside. */
const MARGIN = 8;
const CONTENT_WIDTH = 100 - MARGIN * 2;

/** Rendered text has no explicit line-height, so this tracks the browser default. */
const LINE_HEIGHT = 1.25;

function fontSize(scale: number) {
  const units = Math.round(DEFAULT_FONT_SIZE_UNITS * scale);
  return Math.min(Math.max(units, MIN_FONT_SIZE_UNITS), MAX_FONT_SIZE_UNITS);
}

/**
 * Lays specs out as a top-down column starting at `startY`.
 *
 * Frames are percentages of the page, but type is sized in page *units* (relative to
 * page width), so how tall a line is as a percentage depends on the aspect ratio —
 * hence the page-height conversion rather than hardcoded percentage heights.
 */
function column({
  specs,
  startY,
  aspectWidth,
  aspectHeight,
}: {
  specs: TextSpec[];
  startY: number;
  aspectWidth: number;
  aspectHeight: number;
}): TextBlock[] {
  const pageHeightUnits = (PAGE_WIDTH_UNITS * aspectHeight) / aspectWidth;
  let y = startY;

  return specs.map((spec) => {
    y += spec.gapBefore ?? 0;
    const size = fontSize(spec.fontScale);
    const height = Math.min(
      ((size * LINE_HEIGHT * spec.lines) / pageHeightUnits) * 100,
      100 - y,
    );
    const block: TextBlock = {
      ...createTextBlock(),
      text: spec.text,
      fontFamily: spec.fontFamily,
      fontSize: size,
      color: spec.color,
      textAlign: spec.textAlign ?? "left",
      x: MARGIN,
      y,
      width: CONTENT_WIDTH,
      height,
    };

    y += height;

    return block;
  });
}

function dispatchPage(title: string, aspectWidth: number, aspectHeight: number): TemplatePage {
  return {
    background: { type: "color", value: "#f4efe4" },
    blocks: column({
      startY: MARGIN,
      aspectWidth,
      aspectHeight,
      specs: [
        {
          text: "THE DISPATCH — ISSUE No. 01",
          fontScale: 0.55,
          fontFamily: "Courier New",
          color: "#ef2d32",
          lines: 1,
        },
        {
          text: title,
          fontScale: 2.6,
          fontFamily: "Impact",
          color: "#111111",
          lines: 2,
          gapBefore: 2,
        },
        {
          text: "A dispatch from the middle of it — reported, argued over, and set in type before anyone could talk us out of running it.",
          fontScale: 1,
          fontFamily: "Georgia",
          color: "#333333",
          lines: 4,
          gapBefore: 3,
        },
        {
          text: "Words and pictures by you",
          fontScale: 0.5,
          fontFamily: "Courier New",
          color: "#555555",
          lines: 1,
          gapBefore: 2,
        },
      ],
    }),
  };
}

function photoEssayPage(title: string, aspectWidth: number, aspectHeight: number): TemplatePage {
  return {
    background: {
      type: "gradient",
      value: "linear-gradient(180deg, #1b1b1f 0%, #332d2e 100%)",
    },
    blocks: [
      // Sits where the opening photograph goes, so the empty frame reads as a
      // deliberate slot rather than a blank half-page.
      ...column({
        startY: 24,
        aspectWidth,
        aspectHeight,
        specs: [
          {
            text: "Your opening photograph goes here — add it with + Image.",
            fontScale: 0.5,
            fontFamily: "Arial",
            color: "#8b8792",
            lines: 1,
            textAlign: "center",
          },
        ],
      }),
      ...column({
        startY: 56,
        aspectWidth,
        aspectHeight,
        specs: [
          {
            text: title,
            fontScale: 1.9,
            fontFamily: "Arial",
            color: "#f5f2ec",
            lines: 2,
          },
          {
            text: "Six frames. One week. No captions until the last page.",
            fontScale: 0.5,
            fontFamily: "Courier New",
            color: "#c8c2b6",
            lines: 1,
            gapBefore: 2,
          },
        ],
      }),
    ],
  };
}

/**
 * The first page a new draft opens to, or `null` for starting points that
 * deliberately begin with nothing at all.
 */
export function firstPageForTemplate(
  templateKey: ZineTemplateKey | null,
  title: string,
  aspectWidth: number,
  aspectHeight: number,
): TemplatePage {
  switch (templateKey) {
    case "dispatch":
      return dispatchPage(title, aspectWidth, aspectHeight);
    case "photo-essay":
      return photoEssayPage(title, aspectWidth, aspectHeight);
    default:
      return {
        background: { type: "color", value: "#f4efe4" },
        blocks: column({
          startY: 18,
          aspectWidth,
          aspectHeight,
          specs: [
            {
              text: title,
              fontScale: 2.6,
              fontFamily: "Impact",
              color: "#111111",
              lines: 3,
            },
            {
              text: "A zine by you",
              fontScale: 0.55,
              fontFamily: "Courier New",
              color: "#555555",
              lines: 1,
              gapBefore: 4,
            },
          ],
        }),
      };
  }
}
