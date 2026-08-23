"use client";

import type { PageBlock } from "@/db/schema";
import {
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

const frameFields = ["x", "y", "width", "height"] as const;

type BlockEditorProps = {
  block: PageBlock;
  onChange: (value: PageBlockPatch) => void;
  onDelete: () => void;
};

export function BlockEditor({ block, onChange, onDelete }: BlockEditorProps) {
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
      ) : (
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
        </>
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
