"use client";

import type { PageBackground } from "@/db/schema";

const backgrounds: PageBackground[] = [
  { type: "color", value: "#ffffff" },
  { type: "color", value: "#f5e9d4" },
  { type: "color", value: "#ef2d32" },
  { type: "gradient", value: "linear-gradient(135deg, #2455ff, #ef2d32)" },
];

type BackgroundEditorProps = {
  background: PageBackground;
  onChange: (value: PageBackground) => void;
};

export function BackgroundEditor({ background, onChange }: BackgroundEditorProps) {
  return (
    <fieldset className="mt-8 border-t border-black/20 pt-5">
      <legend className="editorial-display text-lg">Background</legend>
      <div className="mt-3 flex gap-2">
        {backgrounds.map((item) => (
          <button
            aria-label={`Use ${item.value} background`}
            className={`h-8 w-8 border ${item.value === background.value ? "border-2 border-[var(--editorial-blue)]" : "border-black"}`}
            key={item.value}
            onClick={() => onChange(item)}
            style={{ background: item.value }}
            type="button"
          />
        ))}
      </div>
      <label className="mt-4 block text-xs font-bold uppercase">
        Custom color
        <input
          className="mt-1 block h-10 w-full"
          onChange={(event) => onChange({ type: "color", value: event.target.value })}
          type="color"
          value={background.type === "color" ? background.value : "#ffffff"}
        />
      </label>
    </fieldset>
  );
}
