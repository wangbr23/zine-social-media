/**
 * Geometry for direct manipulation on the editor canvas.
 *
 * Everything here is pure: a gesture's starting frame plus how far the pointer has
 * travelled in canvas pixels goes in, a frame in page percentages comes out. The canvas
 * layer only has to own the pointer plumbing, and drag/resize results land on the same
 * `onChange` path as the numeric inspector fields, so neither input method goes stale.
 */

import {
  MAX_BLOCK_POSITION_PERCENT,
  MAX_BLOCK_SIZE_PERCENT,
  MIN_BLOCK_POSITION_PERCENT,
} from "@/lib/zines/blocks";

/** A block's frame in page percentages — the unit blocks are stored and validated in. */
export type BlockFrame = { x: number; y: number; width: number; height: number };

/** The rendered page surface in CSS pixels, measured when a gesture starts. */
export type CanvasSize = { width: number; height: number };

/** A point in canvas pixels, relative to the page surface's top-left corner. */
export type CanvasPoint = { x: number; y: number };

export const RESIZE_HANDLES = [
  { id: "nw", dirX: -1, dirY: -1, cursor: "nwse-resize", label: "top left" },
  { id: "n", dirX: 0, dirY: -1, cursor: "ns-resize", label: "top" },
  { id: "ne", dirX: 1, dirY: -1, cursor: "nesw-resize", label: "top right" },
  { id: "e", dirX: 1, dirY: 0, cursor: "ew-resize", label: "right" },
  { id: "se", dirX: 1, dirY: 1, cursor: "nwse-resize", label: "bottom right" },
  { id: "s", dirX: 0, dirY: 1, cursor: "ns-resize", label: "bottom" },
  { id: "sw", dirX: -1, dirY: 1, cursor: "nesw-resize", label: "bottom left" },
  { id: "w", dirX: -1, dirY: 0, cursor: "ew-resize", label: "left" },
] as const;

export type ResizeHandle = (typeof RESIZE_HANDLES)[number];

/** Small enough to still be grabbable by its handles at any canvas size. */
const MIN_SIZE_PERCENT = 2;
const ROTATION_SNAP_DEGREES = 15;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Snaps to a tenth of a percent — finer than a pixel at any canvas size we render, but
 * coarse enough to read in the number fields.
 */
function snap(value: number) {
  return Math.round(value * 10) / 10;
}

/**
 * Keep a sliver of the block reachable while allowing it to bleed beyond every edge.
 * The wider server bounds remain the final guard for values entered numerically.
 */
function normalize(frame: BlockFrame): BlockFrame {
  const width = clamp(snap(frame.width), MIN_SIZE_PERCENT, MAX_BLOCK_SIZE_PERCENT);
  const height = clamp(snap(frame.height), MIN_SIZE_PERCENT, MAX_BLOCK_SIZE_PERCENT);
  return {
    width,
    height,
    x: clamp(
      snap(frame.x),
      Math.max(MIN_BLOCK_POSITION_PERCENT, MIN_SIZE_PERCENT - width),
      Math.min(MAX_BLOCK_POSITION_PERCENT, 100 - MIN_SIZE_PERCENT),
    ),
    y: clamp(
      snap(frame.y),
      Math.max(MIN_BLOCK_POSITION_PERCENT, MIN_SIZE_PERCENT - height),
      Math.min(MAX_BLOCK_POSITION_PERCENT, 100 - MIN_SIZE_PERCENT),
    ),
  };
}

export function frameOf(block: BlockFrame): BlockFrame {
  return { x: block.x, y: block.y, width: block.width, height: block.height };
}

/** Centre of a frame, in canvas pixels. */
function centerOf(frame: BlockFrame, canvas: CanvasSize): CanvasPoint {
  return {
    x: ((frame.x + frame.width / 2) / 100) * canvas.width,
    y: ((frame.y + frame.height / 2) / 100) * canvas.height,
  };
}

export function moveFrame(
  start: BlockFrame,
  delta: CanvasPoint,
  canvas: CanvasSize,
): BlockFrame {
  return normalize({
    ...start,
    x: start.x + (delta.x / canvas.width) * 100,
    y: start.y + (delta.y / canvas.height) * 100,
  });
}

export function resizeFrame({
  canvas,
  delta,
  handle,
  rotation,
  start,
}: {
  canvas: CanvasSize;
  delta: CanvasPoint;
  handle: ResizeHandle;
  rotation: number;
  start: BlockFrame;
}): BlockFrame {
  // In pixels, not percentages: rotation happens in rendered space, and a percentage
  // means a different number of pixels horizontally than vertically on a non-square page.
  const width = (start.width / 100) * canvas.width;
  const height = (start.height / 100) * canvas.height;
  const center = centerOf(start, canvas);

  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  // Pointer travel re-expressed along the block's own axes, so a handle on a rotated
  // block still resizes along the edge it sits on.
  const localX = delta.x * cos + delta.y * sin;
  const localY = -delta.x * sin + delta.y * cos;

  const minWidth = (MIN_SIZE_PERCENT / 100) * canvas.width;
  const minHeight = (MIN_SIZE_PERCENT / 100) * canvas.height;
  const nextWidth = Math.max(width + handle.dirX * localX, minWidth);
  const nextHeight = Math.max(height + handle.dirY * localY, minHeight);

  // The corner or edge opposite the handle stays put; the centre moves to suit. (An edge
  // handle has a zero direction on one axis, which leaves that axis untouched.)
  const anchorX = (-handle.dirX * width) / 2;
  const anchorY = (-handle.dirY * height) / 2;
  const nextAnchorX = (handle.dirX * nextWidth) / 2;
  const nextAnchorY = (handle.dirY * nextHeight) / 2;
  const nextCenterX =
    center.x + anchorX * cos - anchorY * sin + nextAnchorX * cos - nextAnchorY * sin;
  const nextCenterY =
    center.y + anchorX * sin + anchorY * cos + nextAnchorX * sin + nextAnchorY * cos;

  return normalize({
    x: ((nextCenterX - nextWidth / 2) / canvas.width) * 100,
    y: ((nextCenterY - nextHeight / 2) / canvas.height) * 100,
    width: (nextWidth / canvas.width) * 100,
    height: (nextHeight / canvas.height) * 100,
  });
}

/** Angle in degrees from a frame's centre to a point on the canvas. */
export function angleToCenter(
  point: CanvasPoint,
  frame: BlockFrame,
  canvas: CanvasSize,
) {
  const center = centerOf(frame, canvas);
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

/** Rotation has no stored bounds; this only keeps the number tidy for the inspector. */
export function normalizeRotation(degrees: number, snapToIncrements: boolean) {
  const rounded = snapToIncrements
    ? Math.round(degrees / ROTATION_SNAP_DEGREES) * ROTATION_SNAP_DEGREES
    : Math.round(degrees);
  return ((rounded % 360) + 360) % 360;
}
