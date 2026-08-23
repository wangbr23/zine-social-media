type MastheadProps = {
  children: string;
  eyebrow?: string;
};

export function Masthead({ children, eyebrow }: MastheadProps) {
  return (
    <header className="editorial-masthead">
      {eyebrow ? <p className="editorial-eyebrow">{eyebrow}</p> : null}
      <h1>{children}</h1>
    </header>
  );
}
