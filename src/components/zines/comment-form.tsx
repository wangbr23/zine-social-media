"use client";

import { useActionState, useEffect, useRef } from "react";

type CommentState = { error?: string; submissionCount?: number };

type CommentFormProps = {
  action: (state: CommentState, formData: FormData) => Promise<CommentState>;
};

export function CommentForm({ action }: CommentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.submissionCount) formRef.current?.reset();
  }, [state.submissionCount]);

  return (
    <form action={formAction} className="mt-5" ref={formRef}>
      <label className="sr-only" htmlFor="zine-comment">
        Add a comment
      </label>
      <textarea
        aria-describedby={state.error ? "comment-error" : undefined}
        aria-invalid={Boolean(state.error)}
        className="min-h-24 w-full resize-y border border-black bg-white p-3 text-sm outline-none focus:border-[var(--editorial-blue)] focus:ring-1 focus:ring-[var(--editorial-blue)]"
        disabled={pending}
        id="zine-comment"
        maxLength={2000}
        name="body"
        placeholder="Add to the conversation…"
        required
      />
      <div className="mt-2 flex items-start justify-between gap-4">
        {state.error ? (
          <p className="text-sm text-red-700" id="comment-error">
            {state.error}
          </p>
        ) : (
          <span />
        )}
        <button
          className="editorial-button border border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
