type BottomNavProps = {
  active: "newsstand" | "create" | "library" | "profile";
};

const items = [
  { id: "newsstand", icon: "★", label: "Newsstand" },
  { id: "create", icon: "+", label: "Create" },
  { id: "library", icon: "♥", label: "Library" },
  { id: "profile", icon: "●", label: "Profile" },
] as const;

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav aria-label="Primary" className="editorial-bottom-nav">
      {items.map((item) => (
        <span
          className={item.id === active ? "is-active" : undefined}
          key={item.id}
        >
          <b aria-hidden="true">{item.icon}</b>
          {item.label}
        </span>
      ))}
    </nav>
  );
}
