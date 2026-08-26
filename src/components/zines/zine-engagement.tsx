import Link from "next/link";

import type {
  CommentState,
  DeleteCommentResult,
} from "@/app/magazine/[handle]/[slug]/actions";

import { CommentControls } from "./comment-controls";
import { CommentForm } from "./comment-form";

type ZineComment = {
  id: string;
  body: string;
  createdAt: Date;
  displayName: string;
  handle: string;
  viewerOwnsComment: boolean;
};

type ZineEngagementProps = {
  comments: ZineComment[];
  commentAction: (
    state: CommentState,
    formData: FormData,
  ) => Promise<CommentState>;
  deleteCommentAction: (commentId: string) => Promise<DeleteCommentResult>;
  editCommentAction: (
    commentId: string,
    state: CommentState,
    formData: FormData,
  ) => Promise<CommentState>;
  isSignedIn: boolean;
  likeAction: () => Promise<void>;
  likeCount: number;
  viewerHasLiked: boolean;
};

export function ZineEngagement({
  comments,
  commentAction,
  deleteCommentAction,
  editCommentAction,
  isSignedIn,
  likeAction,
  likeCount,
  viewerHasLiked,
}: ZineEngagementProps) {
  return (
    <section className="mx-auto mt-12 max-w-3xl border-t border-black pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="editorial-eyebrow">Reader response</p>
          <p className="editorial-display text-2xl">
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </p>
        </div>
        <form action={likeAction}>
          <button
            aria-pressed={viewerHasLiked}
            className={`editorial-button border border-black px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] ${viewerHasLiked ? "bg-[var(--editorial-red)] text-white" : "bg-white text-black"}`}
            type="submit"
          >
            {viewerHasLiked ? "♥ Liked" : "♡ Like"}
          </button>
        </form>
      </div>

      <div className="mt-8 border-t border-black/20 pt-6">
        <h2 className="editorial-display text-3xl">
          Comments <span className="text-black/40">({comments.length})</span>
        </h2>

        {isSignedIn ? (
          <CommentForm action={commentAction} />
        ) : (
          <p className="mt-4 border-l-4 border-[var(--editorial-blue)] bg-blue-50 px-4 py-3 text-sm">
            <Link className="editorial-link font-bold" href="/sign-in">
              Sign in
            </Link>{" "}
            to like or join the conversation.
          </p>
        )}

        {comments.length ? (
          <ol className="mt-7 divide-y divide-black/15 border-y border-black/15">
            {comments.map((comment) => (
              <li className="py-5" key={comment.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    className="editorial-text-link font-bold"
                    href={`/magazine/${comment.handle}`}
                  >
                    {comment.displayName} @{comment.handle}
                  </Link>
                  <time
                    className="text-xs uppercase tracking-wider text-[var(--editorial-muted)]"
                    dateTime={comment.createdAt.toISOString()}
                  >
                    {comment.createdAt.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <p className="editorial-serif mt-2 whitespace-pre-wrap break-words text-base">
                  {comment.body}
                </p>
                {comment.viewerOwnsComment ? (
                  <CommentControls
                    body={comment.body}
                    commentId={comment.id}
                    deleteAction={deleteCommentAction.bind(null, comment.id)}
                    editAction={editCommentAction.bind(null, comment.id)}
                  />
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="editorial-serif mt-7 text-black/55">
            No comments yet. Be the first to leave a note.
          </p>
        )}
      </div>
    </section>
  );
}
