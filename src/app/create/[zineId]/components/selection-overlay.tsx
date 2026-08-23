"use client";

import type { PointerEvent } from "react";

import type { PageBlock } from "@/db/schema";

import { RESIZE_HANDLES, type ResizeHandle } from "../block-transform";

type SelectionOverlayProps = {
  block: PageBlock;
  onResizePointerDown: (handle: ResizeHandle, event: PointerEvent<HTMLElement>) => void;
  onRotatePointerDown: (event: PointerEvent<HTMLElement>) => void;
};

const handleClass =
  "pointer-events-auto absolute h-[11px] w-[11px] border border-black bg-white shadow-[0_0_0_1px_rgba(255,255,255,.7)]";

/**
 * Resize and rotate handles for the selected block, drawn above the page rather than
 * inside it — the block itself clips its content, and the rotate handle sits outside the
 * block's own edges. Handles live in a wrapper that carries the block's rotation, so they
 * stay attached to the corners they belong to.
 */
export function SelectionOverlay({
  block,
  onResizePointerDown,
  onRotatePointerDown,
}: SelectionOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        height: `${block.height}%`,
        left: `${block.x}%`,
        top: `${block.y}%`,
        transform: `rotate(${block.rotation}deg)`,
        width: `${block.width}%`,
      }}
    >
      <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 -translate-y-full bg-black/45" />
      <span
        aria-hidden="true"
        className="pointer-events-auto absolute h-[13px] w-[13px] rounded-full border border-black bg-white shadow-[0_0_0_1px_rgba(255,255,255,.7)]"
        onPointerDown={onRotatePointerDown}
        style={{
          cursor: "grab",
          left: "50%",
          top: 0,
          touchAction: "none",
          transform: "translate(-50%, calc(-100% - 16px))",
        }}
      />
      {RESIZE_HANDLES.map((handle) => (
        <span
          aria-hidden="true"
          className={handleClass}
          key={handle.id}
          onPointerDown={(event) => onResizePointerDown(handle, event)}
          style={{
            cursor: handle.cursor,
            left: `${(handle.dirX + 1) * 50}%`,
            top: `${(handle.dirY + 1) * 50}%`,
            touchAction: "none",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
