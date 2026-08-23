"use client";

import { type PointerEvent, useRef, useState } from "react";

import { PageRenderer } from "@/components/zines/page-renderer";
import type { PageBlockPatch } from "@/lib/zines/blocks";

import type { EditorPage } from "../actions";
import {
  angleToCenter,
  type BlockFrame,
  type CanvasPoint,
  type CanvasSize,
  frameOf,
  moveFrame,
  normalizeRotation,
  resizeFrame,
  type ResizeHandle,
} from "../block-transform";
import { SelectionOverlay } from "./selection-overlay";

type EditorCanvasProps = {
  page: EditorPage | null;
  aspectWidth: number;
  aspectHeight: number;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onChangeBlock: (blockId: string, values: PageBlockPatch) => void;
  onAddPage: () => void;
};

/**
 * A gesture is captured once at pointer-down and answered from that snapshot, so every
 * move is computed against where the block started rather than accumulating rounding
 * error, and a mid-drag re-render can't change what the drag is doing.
 */
type Gesture = {
  blockId: string;
  /** The page surface's size and client-space origin when the gesture started. */
  canvas: CanvasSize;
  frame: BlockFrame;
  origin: CanvasPoint;
  pointerId: number;
  rotation: number;
} & (
  | { kind: "move" }
  | { kind: "resize"; handle: ResizeHandle }
  /** Pointer angle at grab time minus the block's rotation, so the knob doesn't jump. */
  | { kind: "rotate"; grabOffset: number }
);

/** Everything a gesture knows before its kind decides what to do with it. */
type GestureBase = Omit<Gesture, "kind">;

export function EditorCanvas({
  page,
  aspectWidth,
  aspectHeight,
  selectedBlockId,
  onSelectBlock,
  onChangeBlock,
  onAddPage,
}: EditorCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(null);
  const selectedBlock = page?.blocks.find((item) => item.id === selectedBlockId) ?? null;

  const startGesture = (
    event: PointerEvent<HTMLElement>,
    blockId: string,
    build: (base: GestureBase, pointer: CanvasPoint) => Gesture,
  ) => {
    const block = page?.blocks.find((item) => item.id === blockId);
    const surface = surfaceRef.current?.getBoundingClientRect();
    // One gesture at a time — a second finger or button mid-drag is ignored, not merged.
    if (!block || !surface || event.button !== 0 || gestureRef.current) return;

    // Stops text selection and the browser's native image drag from hijacking the gesture.
    event.preventDefault();
    gestureRef.current = build(
      {
        blockId,
        canvas: { height: surface.height, width: surface.width },
        frame: frameOf(block),
        origin: { x: event.clientX, y: event.clientY },
        pointerId: event.pointerId,
        rotation: block.rotation,
      },
      { x: event.clientX - surface.left, y: event.clientY - surface.top },
    );
    // Capture on the wrapper rather than on whatever was grabbed: it's this component's
    // own element, so the handlers below keep firing even outside the page or the window.
    surfaceRef.current?.setPointerCapture(event.pointerId);
  };

  const startMove = (blockId: string, event: PointerEvent<HTMLElement>) => {
    onSelectBlock(blockId);
    startGesture(event, blockId, (base) => ({ ...base, kind: "move" }));
  };

  const startResize = (handle: ResizeHandle, event: PointerEvent<HTMLElement>) => {
    if (!selectedBlockId) return;
    startGesture(event, selectedBlockId, (base) => ({ ...base, handle, kind: "resize" }));
  };

  const startRotate = (event: PointerEvent<HTMLElement>) => {
    if (!selectedBlockId) return;
    startGesture(event, selectedBlockId, (base, pointer) => ({
      ...base,
      grabOffset: angleToCenter(pointer, base.frame, base.canvas) - base.rotation,
      kind: "rotate",
    }));
  };

  const continueGesture = (event: PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const delta = {
      x: event.clientX - gesture.origin.x,
      y: event.clientY - gesture.origin.y,
    };

    if (gesture.kind === "move") {
      onChangeBlock(gesture.blockId, moveFrame(gesture.frame, delta, gesture.canvas));
      return;
    }
    if (gesture.kind === "resize") {
      onChangeBlock(
        gesture.blockId,
        resizeFrame({
          canvas: gesture.canvas,
          delta,
          handle: gesture.handle,
          rotation: gesture.rotation,
          start: gesture.frame,
        }),
      );
      return;
    }
    // Rotation is an absolute angle, not a delta, so it needs where the page is now.
    const surface = surfaceRef.current?.getBoundingClientRect();
    if (!surface) return;
    const pointer = { x: event.clientX - surface.left, y: event.clientY - surface.top };
    onChangeBlock(gesture.blockId, {
      rotation: normalizeRotation(
        angleToCenter(pointer, gesture.frame, gesture.canvas) - gesture.grabOffset,
        event.shiftKey,
      ),
    });
  };

  const endGesture = (event: PointerEvent<HTMLElement>) => {
    if (!gestureRef.current) return;
    if (surfaceRef.current?.hasPointerCapture(event.pointerId)) {
      surfaceRef.current.releasePointerCapture(event.pointerId);
    }
    gestureRef.current = null;
  };

  return (
    <section className="flex min-h-[520px] items-center justify-center overflow-auto border border-black/20 bg-[#d8d8d4] p-6">
      {page ? (
        <div
          // Page text is edited in the inspector, so on-canvas selection only ever fights
          // a drag. The wrapper is also the pointer-capture target for every gesture.
          className="relative w-full max-w-[640px] select-none"
          onPointerCancel={endGesture}
          // Pointer capture is released on its own if the element is removed mid-gesture.
          onLostPointerCapture={endGesture}
          onPointerMove={continueGesture}
          onPointerUp={endGesture}
          ref={surfaceRef}
        >
          <PageRenderer
            aspectHeight={aspectHeight}
            aspectWidth={aspectWidth}
            className="w-full shadow-[8px_8px_0_rgba(0,0,0,.18)]"
            editingTextBlockId={editingTextBlockId}
            onBlockPointerDown={startMove}
            onChangeText={(blockId, text) => onChangeBlock(blockId, { text })}
            onEditText={setEditingTextBlockId}
            onFinishTextEditing={() => setEditingTextBlockId(null)}
            onSelectBlock={onSelectBlock}
            page={page}
            selectedBlockId={selectedBlockId}
          />
          {selectedBlock ? (
            <SelectionOverlay
              block={selectedBlock}
              onResizePointerDown={startResize}
              onRotatePointerDown={startRotate}
            />
          ) : null}
        </div>
      ) : (
        <div className="text-center">
          <h2 className="editorial-display text-3xl">Start with a page</h2>
          <button
            className="editorial-button mt-5 bg-[var(--editorial-red)] px-5 py-3 font-bold uppercase text-white"
            onClick={onAddPage}
            type="button"
          >
            Add first page
          </button>
        </div>
      )}
    </section>
  );
}
