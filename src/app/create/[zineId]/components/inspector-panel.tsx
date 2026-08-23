"use client";

import type { PageBackground, PageBlock } from "@/db/schema";
import type { PageBlockPatch } from "@/lib/zines/blocks";
import { PAGE_IMAGE_ACCEPT } from "@/lib/zines/page-images";

import { BackgroundEditor } from "./background-editor";
import { BlockEditor } from "./block-editor";

type InspectorPanelProps = {
  /** Null when no page is selected, which also disables the block tools. */
  background: PageBackground | null;
  block: PageBlock | null;
  onAddText: () => void;
  onAddImage: (file: File | undefined) => void;
  onChangeBackground: (value: PageBackground) => void;
  onChangeBlock: (value: PageBlockPatch) => void;
  onDeleteBlock: () => void;
};

export function InspectorPanel({
  background,
  block,
  onAddText,
  onAddImage,
  onChangeBackground,
  onChangeBlock,
  onDeleteBlock,
}: InspectorPanelProps) {
  const disabled = !background;

  return (
    <aside className="border border-black bg-white p-5">
      <h2 className="editorial-display text-xl">Tools</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="editorial-button border border-black px-3 py-3 text-sm font-bold"
          disabled={disabled}
          onClick={onAddText}
          type="button"
        >
          + Text
        </button>
        <label
          className={`editorial-button border border-black px-3 py-3 text-center text-sm font-bold ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
        >
          + Image
          <input
            accept={PAGE_IMAGE_ACCEPT}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              onAddImage(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>
      {background ? (
        <BackgroundEditor background={background} onChange={onChangeBackground} />
      ) : null}
      {block ? (
        <BlockEditor block={block} onChange={onChangeBlock} onDelete={onDeleteBlock} />
      ) : (
        <p className="editorial-serif mt-8 text-sm text-black/55">
          Select a block to edit its content and frame.
        </p>
      )}
    </aside>
  );
}
