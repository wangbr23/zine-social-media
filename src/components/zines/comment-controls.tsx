"use client";

import { type FormEvent, useState, useTransition } from "react";

import type { CommentState, DeleteCommentResult } from "@/app/magazine/[handle]/[slug]/actions";

type CommentControlsProps = {
  body: string;
  commentId: string;
  deleteAction: () => Promise<DeleteCommentResult>;
  editAction: (state: CommentState, formData: FormData) => Promise<CommentState>;
};

export function CommentControls({
  body,
  commentId,
  deleteAction,
  editAction,
}: CommentControlsProps) {
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string>();
  const [editPending, startEditTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startEditTransition(async () => {
      const result = await editAction({}, formData);
      if (result.error) {
        setEditError(result.error);
        return;
      }
      setEditing(false);
    });
  };

  const remove = () => {
    if (!window.confirm("Delete this comment permanently? This cannot be undone.")) return;

    startDeleteTransition(async () => {
      const result = await deleteAction();
      if (!result.ok) window.alert(result.error);
    });
  };

  if (editing) {
    const bodyId = `edit-comment-${commentId}`;
    const errorId = `edit-comment-error-${commentId}`;

    return (
      <form className="mt-3" onSubmit={save}>
        <label className="sr-only" htmlFor={bodyId}>
          Edit comment
        </label>
        <textarea
          aria-describedby={editError ? errorId : undefined}
          aria-invalid={Boolean(editError)}
          className="min-h-24 w-full resize-y border border-black bg-white p-3 text-sm outline-none focus:border-[var(--editorial-blue)] focus:ring-1 focus:ring-[var(--editorial-blue)]"
          defaultValue={body}
          disabled={editPending}
          id={bodyId}
          maxLength={2000}
          name="body"
          required
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          {editError ? (
            <p className="text-sm text-red-700" id={errorId}>
              {editError}
            </p>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="editorial-button px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]" disabled={editPending} onClick={() => setEditing(false)} type="button">Cancel</button>
            <button className="editorial-button border border-black bg-black px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50" disabled={editPending} type="submit">{editPending ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex gap-3 text-xs font-bold uppercase tracking-[0.12em]">
      <button className="editorial-text-link" disabled={deletePending} onClick={() => { setEditError(undefined); setEditing(true); }} type="button">Edit</button>
      <button className="editorial-text-link text-red-700 disabled:opacity-50" disabled={deletePending} onClick={remove} type="button">{deletePending ? "Deleting…" : "Delete"}</button>
    </div>
  );
}
