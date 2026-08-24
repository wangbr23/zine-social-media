"use client";

import { useTransition } from "react";

import type { DeleteZineResult } from "@/lib/zines/draft-actions";

type DeleteZineButtonProps = {
  action: () => Promise<DeleteZineResult>;
  className?: string;
  label: "draft" | "published zine";
  title: string;
};

export function DeleteZineButton({
  action,
  className,
  label,
  title,
}: DeleteZineButtonProps) {
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm(`Delete the ${label} “${title}” permanently? This cannot be undone.`)) {
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
      {pending ? "Deleting…" : `Delete ${label}`}
    </button>
  );
}
