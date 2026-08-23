"use client";

import { useZinePalette } from "./palette-context";

export function ColorSwatches({ label, onSelect }: { label: string; onSelect: (color: string) => void }) {
  const palette = useZinePalette();

  return (
    <div aria-label={label} className="mt-2 flex flex-wrap gap-2" role="group">
      {palette.map((color) => (
        <button
          aria-label={`Use ${color}`}
          className="h-7 w-7 border border-black transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
          key={color}
          onClick={() => onSelect(color)}
          style={{ backgroundColor: color }}
          title={color.toUpperCase()}
          type="button"
        />
      ))}
    </div>
  );
}
