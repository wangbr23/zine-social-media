"use client";

import { useCallback, useEffect, useState } from "react";

import type { PageBackground, PageBlock, ZinePalette } from "@/db/schema";

import { PageRenderer } from "./page-renderer";

type ReaderPage = {
  id: string;
  pageNumber: number;
  background: PageBackground;
  blocks: PageBlock[];
};

type ZineReaderProps = {
  aspectWidth: number;
  aspectHeight: number;
  pages: ReaderPage[];
  title: string;
  palette: ZinePalette;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

export function ZineReader({
  aspectWidth,
  aspectHeight,
  pages,
  title,
  palette,
}: ZineReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState<
    "forward" | "backward" | null
  >(null);
  const lastIndex = pages.length - 1;

  const goToPage = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.max(0, Math.min(lastIndex, nextIndex));

      if (boundedIndex === currentIndex) return;

      setTurnDirection(boundedIndex > currentIndex ? "forward" : "backward");
      setCurrentIndex(boundedIndex);
    },
    [currentIndex, lastIndex],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPage(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToPage(currentIndex + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goToPage(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goToPage(lastIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, goToPage, lastIndex]);

  const currentPage = pages[currentIndex];

  return (
    <section aria-label={`${title} reader`} className="mt-7">
      <div className="zine-reader-stage mx-auto w-full max-w-3xl border border-black bg-white shadow-[8px_8px_0_#111]">
        <div
          className={
            turnDirection
              ? `zine-page-turn zine-page-turn--${turnDirection}`
              : undefined
          }
          key={currentPage.id}
        >
          <PageRenderer
            aspectHeight={aspectHeight}
            aspectWidth={aspectWidth}
            className="w-full"
            page={currentPage}
            palette={palette}
          />
        </div>
      </div>

      <div className="mx-auto mt-7 grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button
          className="editorial-button justify-self-start border border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentIndex === 0}
          onClick={() => goToPage(currentIndex - 1)}
          type="button"
        >
          ← Previous
        </button>

        <p
          aria-live="polite"
          className="text-center text-xs font-bold uppercase tracking-[0.14em]"
        >
          Page {currentIndex + 1} of {pages.length}
        </p>

        <button
          className="editorial-button justify-self-end border border-black bg-black px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentIndex === lastIndex}
          onClick={() => goToPage(currentIndex + 1)}
          type="button"
        >
          Next →
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--editorial-muted)]">
        Use the left and right arrow keys to turn pages.
      </p>
    </section>
  );
}
