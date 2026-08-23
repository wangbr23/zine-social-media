"use client";

export function PalettePanel({ palette }: { palette: string[] }) {
  return (
    <section className="border border-black bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="editorial-display text-xl">Zine palette</h2>
        <span className="text-[10px] font-bold uppercase tracking-wide text-black/50">From template or photo</span>
      </div>
      <div className="mt-3 grid grid-cols-5" aria-label="Current zine colors">
        {palette.map((color) => (
          <div className="h-10 border-y border-l border-black last:border-r" key={color} style={{ backgroundColor: color }} title={color.toUpperCase()} />
        ))}
      </div>
      <p className="editorial-serif mt-3 text-xs text-black/55">
        Uploading a photo refreshes these colors. Use the swatches beside any color control.
      </p>
    </section>
  );
}
