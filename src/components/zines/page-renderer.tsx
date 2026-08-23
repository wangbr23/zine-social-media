"use client";

import type { KeyboardEvent, PointerEvent } from "react";

import type { PageBackground, PageBlock, ShapeKind } from "@/db/schema";
import { pageUnitsToCss } from "@/lib/zines/blocks";

export type RenderablePage = {
  background: PageBackground;
  blocks: PageBlock[];
};

type PageRendererProps = {
  page: RenderablePage;
  aspectWidth: number;
  aspectHeight: number;
  /** Sizing and chrome for the page surface (width, shadow, …) come from the caller. */
  className?: string;
  selectedBlockId?: string | null;
  /** Omit to render a non-interactive page (thumbnails, reader view). */
  onSelectBlock?: (blockId: string) => void;
  /**
   * Handed the raw pointer-down on a block so a caller can drive direct manipulation.
   * Only the event is forwarded — this component owns no drag state — because the blocks
   * are laid out here and re-deriving their hit areas elsewhere would duplicate that.
   */
  onBlockPointerDown?: (blockId: string, event: PointerEvent<HTMLElement>) => void;
  editingTextBlockId?: string | null;
  onEditText?: (blockId: string) => void;
  onChangeText?: (blockId: string, text: string) => void;
  onFinishTextEditing?: () => void;
};

/**
 * The single definition of what a zine page looks like — shared by the editor
 * canvas and, later, page thumbnails and the reader view.
 *
 * The page surface is an inline-size container, so every page-unit length inside it
 * scales with the width the page happens to be drawn at.
 */
export function PageRenderer({
  page,
  aspectWidth,
  aspectHeight,
  className,
  selectedBlockId,
  onSelectBlock,
  onBlockPointerDown,
  editingTextBlockId,
  onEditText,
  onChangeText,
  onFinishTextEditing,
}: PageRendererProps) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        aspectRatio: `${aspectWidth}/${aspectHeight}`,
        background: page.background.value,
        containerType: "inline-size",
      }}
    >
      {page.blocks.map((block) => {
        const frame = {
          left: `${block.x}%`,
          top: `${block.y}%`,
          width: `${block.width}%`,
          height: `${block.height}%`,
          transform: `rotate(${block.rotation}deg)`,
        };

        if (!onSelectBlock) {
          return (
            <div className="absolute overflow-hidden" key={block.id} style={frame}>
              <BlockContent block={block} />
            </div>
          );
        }

        const beginTextEditing = () => {
          onSelectBlock(block.id);
          if (block.type === "text") onEditText?.(block.id);
        };
        const selectFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          beginTextEditing();
        };

        return (
          <div
            aria-label={`Edit ${block.type} block`}
            className={`absolute overflow-hidden border-2 text-left ${onBlockPointerDown ? "cursor-move" : ""} ${block.id === selectedBlockId ? "border-[var(--editorial-blue)]" : "border-transparent hover:border-black/30"}`}
            key={block.id}
            onClick={beginTextEditing}
            onKeyDown={selectFromKeyboard}
            onPointerDown={(event) => onBlockPointerDown?.(block.id, event)}
            role="button"
            // Dragging a block must not also pan the page under it.
            style={{ ...frame, touchAction: onBlockPointerDown ? "none" : undefined }}
            tabIndex={0}
          >
            {block.type === "text" && block.id === editingTextBlockId ? (
              <textarea
                aria-label="Edit text"
                autoFocus
                className="block h-full w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
                onBlur={onFinishTextEditing}
                onChange={(event) => onChangeText?.(block.id, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  color: block.color,
                  fontFamily: block.fontFamily,
                  fontSize: pageUnitsToCss(block.fontSize),
                  textAlign: block.textAlign,
                }}
                value={block.text}
              />
            ) : (
              <BlockContent block={block} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BlockContent({ block }: { block: PageBlock }) {
  if (block.type === "text") {
    return (
      <span
        className="block h-full whitespace-pre-wrap"
        style={{
          color: block.color,
          fontFamily: block.fontFamily,
          fontSize: pageUnitsToCss(block.fontSize),
          textAlign: block.textAlign,
        }}
      >
        {block.text}
      </span>
    );
  }

  if (block.type === "shape") {
    return <ShapeArtwork color={block.color} shape={block.shape} />;
  }

  return (
    // Block images are arbitrary uploaded blobs rendered at author-chosen frames,
    // so they skip next/image rather than requiring a host allowlist and layout rules.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={block.alt}
      className="h-full w-full"
      // The browser's native image drag would otherwise pre-empt dragging the block.
      draggable={false}
      src={block.url}
      style={{ objectFit: block.objectFit }}
    />
  );
}

export function ShapeArtwork({ color, shape }: { color: string; shape: ShapeKind }) {
  if (shape === "speech-bubble") {
    return (
      <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M5 5H95V74H38L19 96L23 74H5Z" fill={color} />
      </svg>
    );
  }

  const clipPath = shape === "starburst"
    ? "polygon(50% 0%,61% 25%,82% 8%,78% 35%,100% 35%,82% 52%,98% 72%,72% 70%,72% 100%,52% 78%,32% 98%,33% 72%,5% 79%,22% 56%,0% 42%,27% 35%,18% 10%,42% 26%)"
    : shape === "torn-paper"
      ? "polygon(0 8%,8% 2%,15% 10%,23% 3%,31% 11%,40% 1%,49% 9%,58% 2%,67% 10%,76% 3%,86% 11%,94% 2%,100% 8%,98% 91%,90% 98%,82% 89%,73% 97%,64% 88%,55% 99%,46% 90%,37% 97%,28% 89%,18% 98%,9% 90%,1% 96%)"
      : "polygon(3% 8%,98% 0%,95% 92%,0% 100%)";

  return (
    <div
      aria-hidden="true"
      className={`h-full w-full ${shape === "tape" ? "opacity-75" : ""}`}
      style={{ backgroundColor: color, clipPath }}
    />
  );
}
