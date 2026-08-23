import type { ImageBlock, PageBlock } from "@/db/schema";

export const AUTO_ARRANGE_LAYOUTS = [
  { key: "scattered", label: "Scattered mood-board" },
  { key: "grid", label: "Editorial grid" },
  { key: "hero", label: "Hero plus three" },
] as const;

export type AutoArrangeLayout = (typeof AUTO_ARRANGE_LAYOUTS)[number]["key"];

type ImageFrame = Pick<ImageBlock, "x" | "y" | "width" | "height" | "rotation">;

const SCATTERED_FRAMES: readonly ImageFrame[] = [
  { x: 4, y: 7, width: 48, height: 39, rotation: -5 },
  { x: 49, y: 4, width: 47, height: 34, rotation: 4 },
  { x: 8, y: 43, width: 42, height: 48, rotation: 3 },
  { x: 47, y: 38, width: 49, height: 54, rotation: -3 },
  { x: 24, y: 24, width: 51, height: 42, rotation: 6 },
  { x: 2, y: 66, width: 38, height: 30, rotation: -7 },
];

function gridFrames(count: number): ImageFrame[] {
  const columns = count === 1 ? 1 : count <= 4 ? 2 : Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const gap = 3;
  const margin = 5;
  const width = (100 - margin * 2 - gap * (columns - 1)) / columns;
  const height = (100 - margin * 2 - gap * (rows - 1)) / rows;

  return Array.from({ length: count }, (_, index) => ({
    x: margin + (index % columns) * (width + gap),
    y: margin + Math.floor(index / columns) * (height + gap),
    width,
    height,
    rotation: 0,
  }));
}

function heroFrames(count: number): ImageFrame[] {
  if (count === 1) return [{ x: 5, y: 5, width: 90, height: 90, rotation: 0 }];
  if (count > 16) return gridFrames(count);

  const sideCount = Math.min(count - 1, 3);
  const sideGap = 3;
  const sideHeight = (90 - sideGap * (sideCount - 1)) / sideCount;
  const frames: ImageFrame[] = [
    { x: 5, y: 5, width: 59, height: 90, rotation: 0 },
    ...Array.from({ length: sideCount }, (_, index) => ({
      x: 67,
      y: 5 + index * (sideHeight + sideGap),
      width: 28,
      height: sideHeight,
      rotation: 0,
    })),
  ];

  // More than four images no longer fit the named composition cleanly; keep every
  // image usable by arranging the remainder as a compact strip over the hero's foot.
  const overflowCount = count - frames.length;
  if (overflowCount > 0) {
    const gap = 2;
    const columns = Math.min(overflowCount, 4);
    const rows = Math.ceil(overflowCount / columns);
    const width = (55 - gap * (columns - 1)) / columns;
    const height = (21 - gap * (rows - 1)) / rows;
    frames.push(
      ...Array.from({ length: overflowCount }, (_, index) => ({
        x: 7 + (index % columns) * (width + gap),
        y: 72 + Math.floor(index / columns) * (height + gap),
        width,
        height,
        rotation: 0,
      })),
    );
  }

  return frames;
}

function framesFor(layout: AutoArrangeLayout, count: number): ImageFrame[] {
  if (layout === "grid") return gridFrames(count);
  if (layout === "hero") return heroFrames(count);
  return Array.from({ length: count }, (_, index) => {
    const frame = SCATTERED_FRAMES[index % SCATTERED_FRAMES.length];
    const cycle = Math.floor(index / SCATTERED_FRAMES.length);
    return {
      ...frame,
      rotation: frame.rotation + (cycle % 2 === 0 ? 1 : -1) * cycle * 2,
    };
  });
}

export function autoArrangeImages(
  blocks: readonly PageBlock[],
  layout: AutoArrangeLayout,
): PageBlock[] {
  const imageCount = blocks.filter((block) => block.type === "image").length;
  const frames = framesFor(layout, imageCount);
  let imageIndex = 0;

  return blocks.map((block) => {
    if (block.type !== "image") return block;
    const frame = frames[imageIndex];
    imageIndex += 1;
    return { ...block, ...frame };
  });
}
