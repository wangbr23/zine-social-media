import Link from "next/link";

type BottomNavProps = {
  active: "newsstand" | "create" | "profile";
};

const items = [
  { id: "newsstand", href: "/newsstand", icon: "★", label: "Newsstand" },
  { id: "create", href: "/create", icon: "+", label: "Create" },
  { id: "profile", href: "/profile", icon: "●", label: "Profile" },
] as const;

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav aria-label="Primary" className="editorial-bottom-nav">
      {items.map((item) => (
        <Link
          aria-current={item.id === active ? "page" : undefined}
          className={`flex flex-col items-center gap-0.5 text-[0.64rem] transition-colors hover:text-[var(--editorial-red)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--editorial-blue)] ${
            item.id === active
              ? "is-active"
              : "text-[var(--editorial-muted)]"
          }`}
          href={item.href}
          key={item.id}
        >
          <b aria-hidden="true" className="min-h-5 text-xl leading-none">
            {item.icon}
          </b>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
