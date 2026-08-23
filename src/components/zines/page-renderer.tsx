"use client";

import type { PointerEvent } from "react";

import type { PageBackground, PageBlock } from "@/db/schema";
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

        return (
          <button
            aria-label={`Edit ${block.type} block`}
            className={`absolute overflow-hidden border-2 text-left ${onBlockPointerDown ? "cursor-move" : ""} ${block.id === selectedBlockId ? "border-[var(--editorial-blue)]" : "border-transparent hover:border-black/30"}`}
            key={block.id}
            onClick={() => onSelectBlock(block.id)}
            onPointerDown={(event) => onBlockPointerDown?.(block.id, event)}
            // Dragging a block must not also pan the page under it.
            style={{ ...frame, touchAction: onBlockPointerDown ? "none" : undefined }}
            type="button"
          >
            <BlockContent block={block} />
          </button>
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
