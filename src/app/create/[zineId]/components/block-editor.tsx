"use client";

import type { PageBlock } from "@/db/schema";
import {
  IMAGE_FILTER_OPTIONS,
  IMAGE_FRAME_OPTIONS,
  MAX_BLOCK_POSITION_PERCENT,
  MAX_BLOCK_SIZE_PERCENT,
  MAX_FONT_SIZE_UNITS,
  MIN_BLOCK_POSITION_PERCENT,
  MIN_FONT_SIZE_UNITS,
  type PageBlockPatch,
} from "@/lib/zines/blocks";
import {
  CURATED_FONTS,
  isCuratedFontFamily,
} from "@/lib/zines/fonts";

import { ColorSwatches } from "./color-swatches";
import { useZinePalette } from "./palette-context";

const frameFields = ["x", "y", "width", "height"] as const;

type BlockEditorProps = {
  block: PageBlock;
  onChange: (value: PageBlockPatch) => void;
  onDelete: () => void;
};

export function BlockEditor({ block, onChange, onDelete }: BlockEditorProps) {
  const palette = useZinePalette();
  return (
    <div className="mt-8 border-t border-black/20 pt-5">
      <h3 className="editorial-display text-lg capitalize">{block.type} block</h3>
      {block.type === "text" ? (
        <>
          <label className="mt-4 block text-xs font-bold uppercase">
            Text
            <textarea
              className="mt-1 min-h-24 w-full border border-black p-2 font-normal normal-case"
              onChange={(event) => onChange({ text: event.target.value })}
              value={block.text}
            />
          </label>
          <label className="mt-3 block text-xs font-bold uppercase">
            Font
            <select
              className="mt-1 w-full border border-black p-2 font-normal normal-case"
              onChange={(event) => {
                if (isCuratedFontFamily(event.target.value)) {
                  onChange({ fontFamily: event.target.value });
                }
              }}
              value={block.fontFamily}
            >
              {CURATED_FONTS.map(({ family, label }) => (
                <option key={family} value={family}>{label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs font-bold uppercase">
            Font size
            <input
              className="mt-1 w-full border border-black p-2 font-normal"
              max={MAX_FONT_SIZE_UNITS}
              min={MIN_FONT_SIZE_UNITS}
              onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
              type="number"
              value={block.fontSize}
            />
          </label>
          <label className="mt-3 block text-xs font-bold uppercase">
            Text color
            <ColorSwatches
              label="Zine palette text colors"
              onSelect={(color) => onChange({ color })}
            />
            <div className="mt-1 flex items-center gap-2 border border-black p-2">
              <input
                aria-label="Text color"
                className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
                onChange={(event) => onChange({ color: event.target.value })}
                type="color"
                value={block.color}
              />
              <span className="font-mono text-xs font-normal normal-case">
                {block.color.toUpperCase()}
              </span>
            </div>
          </label>
          <label className="mt-3 block text-xs font-bold uppercase">
            Alignment
            <select
              className="mt-1 w-full border border-black p-2 font-normal normal-case"
              onChange={(event) => {
                const alignment = event.target.value;
                if (
                  alignment === "left" ||
                  alignment === "center" ||
                  alignment === "right"
                ) {
                  onChange({ textAlign: alignment });
                }
              }}
              value={block.textAlign}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </>
      ) : block.type === "image" ? (
        <>
          <label className="mt-4 block text-xs font-bold uppercase">
            Alt text
            <input
              className="mt-1 w-full border border-black p-2 font-normal normal-case"
              onChange={(event) => onChange({ alt: event.target.value })}
              value={block.alt}
            />
          </label>
          <label className="mt-3 block text-xs font-bold uppercase">
            Fit
            <select
              className="mt-1 w-full border border-black p-2"
              onChange={(event) => {
                const objectFit = event.target.value;
                if (objectFit === "cover" || objectFit === "contain") {
                  onChange({ objectFit });
                }
              }}
              value={block.objectFit}
            >
              <option value="cover">Fill frame</option>
              <option value="contain">Show whole image</option>
            </select>
          </label>
          <ImageTreatmentEditor block={block} onChange={onChange} palette={palette} />
        </>
      ) : (
        <label className="mt-4 block text-xs font-bold uppercase">
          Shape color
          <ColorSwatches
            label="Zine palette shape colors"
            onSelect={(color) => onChange({ color })}
          />
          <div className="mt-1 flex items-center gap-2 border border-black p-2">
            <input
              aria-label="Shape color"
              className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
              onChange={(event) => onChange({ color: event.target.value })}
              type="color"
              value={block.color}
            />
            <span className="font-mono text-xs font-normal normal-case">
              {block.color.toUpperCase()}
            </span>
          </div>
        </label>
      )}
      <p className="editorial-serif mt-6 text-xs text-black/55">
        Drag the block on the page to move it, its handles to resize, and the knob above it
        to rotate — hold shift while rotating to snap. These fields are for exact numbers.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {frameFields.map((field) => (
          <label className="text-xs font-bold uppercase" key={field}>
            {field}
            <input
              className="mt-1 w-full border border-black p-2 font-normal"
              max={
                field === "width" || field === "height"
                  ? MAX_BLOCK_SIZE_PERCENT
                  : MAX_BLOCK_POSITION_PERCENT
              }
              min={
                field === "width" || field === "height"
                  ? 1
                  : MIN_BLOCK_POSITION_PERCENT
              }
              onChange={(event) => onChange({ [field]: Number(event.target.value) })}
              // Gestures land on the same tenth-of-a-percent grid these fields step on.
              step={0.1}
              type="number"
              value={block[field]}
            />
          </label>
        ))}
        <label className="text-xs font-bold uppercase">
          Rotation
          <input
            className="mt-1 w-full border border-black p-2 font-normal"
            max={359}
            min={0}
            onChange={(event) => onChange({ rotation: Number(event.target.value) })}
            step={1}
            type="number"
            value={block.rotation}
          />
        </label>
      </div>
      <button
        className="editorial-text-link mt-6 text-sm text-red-700"
        onClick={onDelete}
        type="button"
      >
        Remove block
      </button>
    </div>
  );
}

function ImageTreatmentEditor({
  block,
  onChange,
  palette,
}: {
  block: Extract<PageBlock, { type: "image" }>;
  onChange: (value: PageBlockPatch) => void;
  palette: readonly string[];
}) {
  return (
    <>
      <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase">Frame</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {IMAGE_FRAME_OPTIONS.map((option) => (
            <button
              aria-pressed={(block.frame ?? "none") === option.value}
              className={`border px-2 py-2 text-xs ${(block.frame ?? "none") === option.value ? "border-black bg-black text-white" : "border-black/30"}`}
              key={option.value}
              onClick={() => onChange({ frame: option.value })}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase">Treatment</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {IMAGE_FILTER_OPTIONS.map((option) => (
            <button
              aria-pressed={(block.filter ?? "none") === option.value}
              className={`border px-2 py-2 text-xs ${(block.filter ?? "none") === option.value ? "border-black bg-black text-white" : "border-black/30"}`}
              key={option.value}
              onClick={() => onChange({ filter: option.value })}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      {(block.filter ?? "none") !== "none" ? (
        <fieldset className="mt-4">
          <legend className="text-xs font-bold uppercase">Palette ink</legend>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {palette.map((color, index) => (
              <button
                aria-label={`Use ${color} as filter ink`}
                className={`aspect-square border-2 ${(block.filterColors ?? [0, 2])[1] === index ? "border-black" : "border-transparent"}`}
                key={`${color}-${index}`}
                onClick={() => onChange({ filterColors: [0, index] })}
                style={{ backgroundColor: color }}
                type="button"
              />
            ))}
          </div>
          <p className="editorial-serif mt-2 text-xs text-black/55">
            The dark and bright inks follow your zine palette.
          </p>
        </fieldset>
      ) : null}
    </>
  );
}
