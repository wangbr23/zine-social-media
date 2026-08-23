import Link from "next/link";

type FollowRequest = {
  id: string;
  displayName: string;
  handle: string;
};

type FollowRequestsProps = {
  requests: FollowRequest[];
  approveAction: (requestId: string) => Promise<void>;
  denyAction: (requestId: string) => Promise<void>;
};

export function FollowRequests({
  requests,
  approveAction,
  denyAction,
}: FollowRequestsProps) {
  if (!requests.length) return null;

  return (
    <section className="mb-10 border-y border-black py-6">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="editorial-display text-3xl">FOLLOW REQUESTS</h2>
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--editorial-red)]">
          {requests.length} pending
        </span>
      </div>
      <div className="grid gap-3">
        {requests.map((request) => (
          <article
            className="flex flex-wrap items-center justify-between gap-4 border border-[var(--editorial-rule)] p-4"
            key={request.id}
          >
            <Link
              className="editorial-text-link min-w-0"
              href={`/magazine/${request.handle}`}
            >
              <strong className="block truncate">{request.displayName}</strong>
              <span className="text-sm text-[var(--editorial-blue)]">
                @{request.handle}
              </span>
            </Link>
            <div className="flex gap-2">
              <form action={approveAction.bind(null, request.id)}>
                <button
                  className="editorial-button border border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                  type="submit"
                >
                  Approve
                </button>
              </form>
              <form action={denyAction.bind(null, request.id)}>
                <button
                  className="editorial-button border border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider"
                  type="submit"
                >
                  Deny
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
