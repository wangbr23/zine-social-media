"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

type EditorHeaderProps = {
  title: string;
  templateKey: string | null;
  message: string | null;
  saveDisabled: boolean;
  onExit: (event: MouseEvent<HTMLAnchorElement>) => void;
  onSave: () => void;
};

export function EditorHeader({
  title,
  templateKey,
  message,
  saveDisabled,
  onExit,
  onSave,
}: EditorHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black bg-white px-5 py-4 md:px-8">
      <div>
        <p className="editorial-eyebrow !mb-1">
          Page editor · {templateKey?.replace("-", " ")}
        </p>
        <h1 className="editorial-display text-2xl md:text-3xl">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span aria-live="polite" className="text-sm text-black/60">
          {message}
        </span>
        <Link
          className="editorial-text-link text-sm font-bold"
          href="/profile?tab=drafts"
          onClick={onExit}
        >
          Exit
        </Link>
        <button
          className="editorial-button bg-black px-5 py-3 text-sm font-bold uppercase text-white disabled:opacity-50"
          disabled={saveDisabled}
          onClick={onSave}
          type="button"
        >
          Save page
        </button>
      </div>
    </header>
  );
}
