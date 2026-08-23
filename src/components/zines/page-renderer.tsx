"use client";

import type { PageBackground, PageBlock } from "@/db/schema";

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
};

/**
 * The single definition of what a zine page looks like — shared by the editor
 * canvas and, later, page thumbnails and the reader view.
 */
export function PageRenderer({
  page,
  aspectWidth,
  aspectHeight,
  className,
  selectedBlockId,
  onSelectBlock,
}: PageRendererProps) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        aspectRatio: `${aspectWidth}/${aspectHeight}`,
        background: page.background.value,
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
            className={`absolute overflow-hidden border-2 text-left ${block.id === selectedBlockId ? "border-[var(--editorial-blue)]" : "border-transparent hover:border-black/30"}`}
            key={block.id}
            onClick={() => onSelectBlock(block.id)}
            style={frame}
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
          fontSize: `${block.fontSize}px`,
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
      src={block.url}
      style={{ objectFit: block.objectFit }}
    />
  );
}
