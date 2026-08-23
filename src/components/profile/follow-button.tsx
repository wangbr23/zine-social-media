type FollowButtonProps = {
  action: () => Promise<void>;
  status: "accepted" | "pending" | null;
};

export function FollowButton({ action, status }: FollowButtonProps) {
  const label =
    status === "accepted"
      ? "Following"
      : status === "pending"
        ? "Requested"
        : "Follow";

  return (
    <form action={action}>
      <button
        className={`editorial-button border border-black px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] ${status ? "bg-white text-black" : "bg-black text-white"}`}
        type="submit"
      >
        {label}
      </button>
      {status ? (
        <p className="mt-2 text-right text-xs text-[var(--editorial-muted)]">
          Click to {status === "pending" ? "cancel" : "unfollow"}
        </p>
      ) : null}
    </form>
  );
}
