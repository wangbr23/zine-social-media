"use client";

import type { EditorPage } from "../actions";

type PageRailProps = {
  pages: EditorPage[];
  selectedPageId: string | null;
  canDelete: boolean;
  disabled: boolean;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
};

export function PageRail({
  pages,
  selectedPageId,
  canDelete,
  disabled,
  onSelectPage,
  onAddPage,
  onDeletePage,
}: PageRailProps) {
  return (
    <aside className="border border-black bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="editorial-display text-xl">Pages</h2>
        <button
          aria-label="Add page"
          className="editorial-button h-8 w-8 border border-black font-bold"
          disabled={disabled}
          onClick={onAddPage}
          type="button"
        >
          +
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1">
        {pages.map((page) => (
          <button
            className={`border p-3 text-left text-sm ${page.id === selectedPageId ? "border-[var(--editorial-blue)] bg-blue-50" : "border-black/30"}`}
            key={page.id}
            onClick={() => onSelectPage(page.id)}
            type="button"
          >
            Page {page.pageNumber}
          </button>
        ))}
      </div>
      {canDelete ? (
        <button
          className="editorial-text-link mt-6 text-sm text-red-700"
          disabled={disabled}
          onClick={onDeletePage}
          type="button"
        >
          Delete page
        </button>
      ) : null}
    </aside>
  );
}
