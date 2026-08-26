import Link from "next/link";

export default function NotFound() {
  return (
    <main className="editorial-shell grid place-items-center">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-4xl border-y border-black py-12 text-center md:py-16"
      >
        <p className="editorial-eyebrow">Error 404 · Missing page</p>
        <p
          aria-hidden="true"
          className="editorial-display text-[clamp(6rem,24vw,14rem)] leading-[0.75] text-[var(--editorial-red)]"
        >
          404
        </p>
        <h1
          className="editorial-display mt-8 text-4xl leading-none md:text-6xl"
          id="not-found-title"
        >
          THIS PAGE MISSED THE PRESS
        </h1>
        <p className="editorial-serif mx-auto mt-5 max-w-xl text-lg text-black/65 md:text-xl">
          The issue or magazine may have moved, stayed private, or no longer
          exists. Head back to the front page or check your Newsstand.
        </p>

        <nav
          aria-label="Page not found recovery"
          className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row"
        >
          <Link
            className="editorial-button inline-block border border-black bg-black px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white"
            href="/"
          >
            Back to the front page
          </Link>
          <Link
            className="editorial-text-link text-sm font-bold uppercase tracking-[0.12em]"
            href="/newsstand"
          >
            Open Newsstand →
          </Link>
        </nav>
      </section>
    </main>
  );
}
