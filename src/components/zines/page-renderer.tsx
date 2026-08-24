"use client";

import type { KeyboardEvent, PointerEvent } from "react";

import type { ImageBlock, PageBackground, PageBlock, ShapeKind, ZinePalette } from "@/db/schema";
import { pageUnitsToCss } from "@/lib/zines/blocks";

export type RenderablePage = {
  background: PageBackground;
  blocks: PageBlock[];
};

type PageRendererProps = {
  page: RenderablePage;
  aspectWidth: number;
  aspectHeight: number;
  palette?: ZinePalette;
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
  palette,
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
              <BlockContent block={block} palette={palette} />
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
              <BlockContent block={block} palette={palette} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BlockContent({ block, palette }: { block: PageBlock; palette?: ZinePalette }) {
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

  return <ImageArtwork block={block} palette={palette} />;
}

const tornEdge = "polygon(0 3%,5% 1%,10% 4%,16% 0,22% 3%,29% 1%,35% 4%,42% 0,49% 3%,56% 1%,63% 4%,70% 0,77% 3%,84% 1%,91% 4%,100% 1%,98% 97%,92% 100%,85% 96%,78% 99%,70% 96%,63% 100%,55% 97%,48% 99%,40% 96%,33% 100%,25% 97%,18% 99%,10% 96%,2% 99%)";

function ImageArtwork({ block, palette }: { block: ImageBlock; palette?: ZinePalette }) {
  const frame = block.frame ?? "none";
  const filter = block.filter ?? "none";
  const [darkIndex, inkIndex] = block.filterColors ?? [0, 2];
  const dark = palette?.[darkIndex] ?? "#111111";
  const ink = palette?.[inkIndex] ?? "#ef2d32";
  const imageFilter = filter === "xerox"
    ? "grayscale(1) contrast(2.4) brightness(1.08)"
    : filter === "none" ? undefined : "grayscale(1) contrast(1.35)";
  const frameStyle = frame === "circle"
    ? { borderRadius: "50%" }
    : frame === "torn-edge" ? { clipPath: tornEdge } : undefined;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${frame === "polaroid" ? "bg-white p-[5%] pb-[16%] shadow-[0_2px_5px_rgba(0,0,0,.3)]" : ""}`}
      style={frameStyle}
    >
      {/* Uploaded blobs have arbitrary URLs and author-controlled frames. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={block.alt}
        className="h-full w-full"
        draggable={false}
        src={block.url}
        style={{ filter: imageFilter, objectFit: block.objectFit }}
      />
      {filter !== "none" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: filter === "riso"
              ? `repeating-radial-gradient(circle at 20% 30%, ${ink} 0 1px, transparent 1px 4px), ${dark}`
              : `linear-gradient(135deg, ${dark}, ${ink})`,
            mixBlendMode: filter === "xerox" ? "multiply" : "color",
            opacity: filter === "riso" ? 0.72 : filter === "xerox" ? 0.38 : 1,
          }}
        />
      ) : null}
    </div>
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
