"use client";

import type { ShapeKind } from "@/db/schema";
import { ShapeArtwork } from "@/components/zines/page-renderer";
import { SHAPE_OPTIONS } from "@/lib/zines/blocks";

import { useZinePalette } from "./palette-context";

type ShapeTrayProps = {
  disabled: boolean;
  onAddShape: (shape: ShapeKind, color: string) => void;
};

export function ShapeTray({ disabled, onAddShape }: ShapeTrayProps) {
  const palette = useZinePalette();
  const color = palette[2];

  return (
    <div className="mt-3 border-t border-black/20 pt-4">
      <p className="text-xs font-bold uppercase">Shapes &amp; stickers</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {SHAPE_OPTIONS.map((option) => (
          <button
            className="editorial-button border border-black px-2 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            key={option.kind}
            onClick={() => onAddShape(option.kind, color)}
            type="button"
          >
            <span className="mx-auto mb-1 block h-7 w-12" aria-hidden="true">
              <ShapeArtwork color={color} shape={option.kind} />
            </span>
            + {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
