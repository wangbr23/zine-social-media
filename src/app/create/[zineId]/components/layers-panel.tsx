"use client";

import type { PageBlock } from "@/db/schema";

type LayersPanelProps = {
  blocks: PageBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onMoveBlock: (direction: "forward" | "backward") => void;
};

function layerName(block: PageBlock) {
  if (block.type === "image") return block.alt.trim() || "Untitled image";

  const text = block.text.trim().replace(/\s+/g, " ");
  return text || "Empty text";
}

export function LayersPanel({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
}: LayersPanelProps) {
  const selectedIndex = blocks.findIndex((block) => block.id === selectedBlockId);

  return (
    <aside className="border border-black bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="editorial-display text-xl">Layers</h2>
        <span className="text-xs font-bold uppercase text-black/45">
          {blocks.length} {blocks.length === 1 ? "item" : "items"}
        </span>
      </div>

      {blocks.length ? (
        <>
          <p className="editorial-serif mt-2 text-xs text-black/55">
            The top item appears in front.
          </p>
          <ol className="mt-4 divide-y divide-black/15 border border-black/20">
            {[...blocks].reverse().map((block) => {
              const selected = block.id === selectedBlockId;

              return (
                <li key={block.id}>
                  <button
                    aria-pressed={selected}
                    className={`w-full px-3 py-3 text-left transition-colors ${
                      selected
                        ? "bg-[var(--editorial-blue)] text-white"
                        : "bg-white hover:bg-black/5"
                    }`}
                    onClick={() => onSelectBlock(block.id)}
                    type="button"
                  >
                    <span className="block text-[10px] font-bold uppercase opacity-60">
                      {block.type}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-bold">
                      {layerName(block)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="editorial-button border border-black px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-35"
              disabled={selectedIndex < 0 || selectedIndex === blocks.length - 1}
              onClick={() => onMoveBlock("forward")}
              type="button"
            >
              Bring forward
            </button>
            <button
              className="editorial-button border border-black px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-35"
              disabled={selectedIndex <= 0}
              onClick={() => onMoveBlock("backward")}
              type="button"
            >
              Send back
            </button>
          </div>
        </>
      ) : (
        <p className="editorial-serif mt-3 text-sm text-black/55">
          Add text or an image to start the stack.
        </p>
      )}
    </aside>
  );
}
