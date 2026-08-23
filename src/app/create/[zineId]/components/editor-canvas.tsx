"use client";

import { PageRenderer } from "@/components/zines/page-renderer";

import type { EditorPage } from "../actions";

type EditorCanvasProps = {
  page: EditorPage | null;
  aspectWidth: number;
  aspectHeight: number;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onAddPage: () => void;
};

export function EditorCanvas({
  page,
  aspectWidth,
  aspectHeight,
  selectedBlockId,
  onSelectBlock,
  onAddPage,
}: EditorCanvasProps) {
  return (
    <section className="flex min-h-[520px] items-center justify-center overflow-auto border border-black/20 bg-[#d8d8d4] p-6">
      {page ? (
        <PageRenderer
          aspectHeight={aspectHeight}
          aspectWidth={aspectWidth}
          className="w-full max-w-[640px] shadow-[8px_8px_0_rgba(0,0,0,.18)]"
          onSelectBlock={onSelectBlock}
          page={page}
          selectedBlockId={selectedBlockId}
        />
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
