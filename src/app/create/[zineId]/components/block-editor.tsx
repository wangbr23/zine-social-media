"use client";

import type { PageBlock } from "@/db/schema";

const fonts = ["Georgia", "Arial", "Courier New", "Impact"];
const frameFields = ["x", "y", "width", "height"] as const;

type BlockEditorProps = {
  block: PageBlock;
  onChange: (value: Partial<PageBlock>) => void;
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
              onChange={(event) => onChange({ fontFamily: event.target.value })}
              value={block.fontFamily}
            >
              {fonts.map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs font-bold uppercase">
            Font size
            <input
              className="mt-1 w-full border border-black p-2 font-normal"
              max={200}
              min={8}
              onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
              type="number"
              value={block.fontSize}
            />
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
              onChange={(event) =>
                onChange({ objectFit: event.target.value as "cover" | "contain" })
              }
              value={block.objectFit}
            >
              <option value="cover">Fill frame</option>
              <option value="contain">Show whole image</option>
            </select>
          </label>
        </>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {frameFields.map((field) => (
          <label className="text-xs font-bold uppercase" key={field}>
            {field}
            <input
              className="mt-1 w-full border border-black p-2 font-normal"
              max={100}
              min={field === "width" || field === "height" ? 1 : 0}
              onChange={(event) => onChange({ [field]: Number(event.target.value) })}
              type="number"
              value={block[field]}
            />
          </label>
        ))}
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
