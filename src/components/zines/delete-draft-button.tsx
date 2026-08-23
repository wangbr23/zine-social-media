"use client";

import { useTransition } from "react";

import type { DeleteDraftResult } from "@/lib/zines/draft-actions";

type DeleteDraftButtonProps = {
  action: () => Promise<DeleteDraftResult>;
  className?: string;
  title: string;
};

export function DeleteDraftButton({
  action,
  className,
  title,
}: DeleteDraftButtonProps) {
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm(`Delete “${title}” permanently? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await action();
      if (!result.ok) window.alert(result.error);
    });
  };

  return (
    <button
      className={className}
      disabled={pending}
      onClick={remove}
      type="button"
    >
      {pending ? "Deleting…" : "Delete draft"}
    </button>
  );
}
