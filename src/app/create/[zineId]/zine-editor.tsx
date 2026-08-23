"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useState, useTransition } from "react";

import type { PageBackground, PageBlock, TextBlock } from "@/db/schema";
import { addPage, deletePage, type EditorPage, savePage } from "./actions";

const fonts = ["Georgia", "Arial", "Courier New", "Impact"];
const backgrounds: PageBackground[] = [
  { type: "color", value: "#ffffff" }, { type: "color", value: "#f5e9d4" },
  { type: "color", value: "#ef2d32" }, { type: "gradient", value: "linear-gradient(135deg, #2455ff, #ef2d32)" },
];

type Zine = { id: string; title: string; aspectWidth: number; aspectHeight: number; templateKey: string | null };

export function ZineEditor({ clerkUserId, initialPages, zine }: { clerkUserId: string; initialPages: EditorPage[]; zine: Zine }) {
  const [allPages, setAllPages] = useState(initialPages);
  const [pageId, setPageId] = useState(initialPages[0]?.id ?? null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const page = allPages.find((item) => item.id === pageId) ?? null;
  const block = page?.blocks.find((item) => item.id === blockId) ?? null;

  const changePage = (update: (value: EditorPage) => EditorPage) => {
    if (!page) return;
    setAllPages((items) => items.map((item) => item.id === page.id ? update(item) : item));
    setMessage("Unsaved changes");
  };
  const changeBlock = (values: Partial<PageBlock>) => {
    if (!block) return;
    changePage((value) => ({ ...value, blocks: value.blocks.map((item) => item.id === block.id ? { ...item, ...values } as PageBlock : item) }));
  };
  const createPage = () => startTransition(async () => {
    const result = await addPage(zine.id);
    if (!result.ok || !result.page) return setMessage(result.ok ? "Could not add a page." : result.error);
    setAllPages((items) => [...items, result.page!]); setPageId(result.page.id); setBlockId(null); setMessage("Page added");
  });
  const persistPage = () => page && startTransition(async () => {
    setMessage("Saving…");
    const result = await savePage(zine.id, page.id, page.background, page.blocks);
    setMessage(result.ok ? "Saved" : result.error);
  });
  const removePage = () => page && window.confirm(`Delete page ${page.pageNumber}?`) && startTransition(async () => {
    const result = await deletePage(zine.id, page.id);
    if (!result.ok) return setMessage(result.error);
    const remaining = allPages.filter((item) => item.id !== page.id);
    setAllPages(remaining); setPageId(remaining[0]?.id ?? null); setBlockId(null); setMessage("Page deleted");
  });
  const createText = () => {
    if (!page) return;
    const item: TextBlock = { id: crypto.randomUUID(), type: "text", x: 10, y: 10, width: 80, height: 20, rotation: 0, text: "Write something worth keeping.", fontFamily: "Georgia", fontSize: 28, color: "#111111", textAlign: "left" };
    changePage((value) => ({ ...value, blocks: [...value.blocks, item] })); setBlockId(item.id);
  };
  const createImage = async (file?: File) => {
    if (!file || !page) return;
    setMessage("Uploading image…");
    try {
      const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
      const blob = await upload(`zine-pages/${clerkUserId}/${name}`, file, { access: "public", handleUploadUrl: "/api/zine-page-images/upload" });
      const item: PageBlock = { id: crypto.randomUUID(), type: "image", x: 10, y: 10, width: 80, height: 50, rotation: 0, url: blob.url, alt: file.name.replace(/\.[^.]+$/, ""), objectFit: "cover" };
      changePage((value) => ({ ...value, blocks: [...value.blocks, item] })); setBlockId(item.id); setMessage("Image uploaded — save the page to keep it");
    } catch (error) { console.error("Image upload failed", error); setMessage("Image upload failed. Use a supported image under 10 MB."); }
  };

  return <main className="min-h-screen bg-[#efefec] pb-8">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black bg-white px-5 py-4 md:px-8">
      <div><p className="editorial-eyebrow !mb-1">Page editor · {zine.templateKey?.replace("-", " ")}</p><h1 className="editorial-display text-2xl md:text-3xl">{zine.title}</h1></div>
      <div className="flex items-center gap-4"><span aria-live="polite" className="text-sm text-black/60">{message}</span><Link className="editorial-text-link text-sm font-bold" href="/profile?tab=drafts">Exit</Link><button className="editorial-button bg-black px-5 py-3 text-sm font-bold uppercase text-white disabled:opacity-50" disabled={!page || pending} onClick={persistPage} type="button">Save page</button></div>
    </header>
    <div className="grid gap-5 p-5 lg:grid-cols-[170px_minmax(320px,1fr)_300px] lg:p-8">
      <aside className="border border-black bg-white p-4"><div className="flex items-center justify-between"><h2 className="editorial-display text-xl">Pages</h2><button aria-label="Add page" className="editorial-button h-8 w-8 border border-black font-bold" disabled={pending} onClick={createPage} type="button">+</button></div><div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1">{allPages.map((item) => <button className={`border p-3 text-left text-sm ${item.id === pageId ? "border-[var(--editorial-blue)] bg-blue-50" : "border-black/30"}`} key={item.id} onClick={() => { setPageId(item.id); setBlockId(null); setMessage(null); }} type="button">Page {item.pageNumber}</button>)}</div>{page ? <button className="editorial-text-link mt-6 text-sm text-red-700" disabled={pending} onClick={removePage} type="button">Delete page</button> : null}</aside>
      <section className="flex min-h-[520px] items-center justify-center overflow-auto border border-black/20 bg-[#d8d8d4] p-6">{page ? <div className="relative w-full max-w-[640px] overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,.18)]" style={{ aspectRatio: `${zine.aspectWidth}/${zine.aspectHeight}`, background: page.background.value }}>{page.blocks.map((item) => <button aria-label={`Edit ${item.type} block`} className={`absolute overflow-hidden border-2 text-left ${item.id === blockId ? "border-[var(--editorial-blue)]" : "border-transparent hover:border-black/30"}`} key={item.id} onClick={() => setBlockId(item.id)} style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, transform: `rotate(${item.rotation}deg)` }} type="button">{item.type === "text" ? <span className="block h-full whitespace-pre-wrap" style={{ color: item.color, fontFamily: item.fontFamily, fontSize: `${item.fontSize}px`, textAlign: item.textAlign }}>{item.text}</span> : <img alt={item.alt} className="h-full w-full" src={item.url} style={{ objectFit: item.objectFit }} />}</button>)}</div> : <div className="text-center"><h2 className="editorial-display text-3xl">Start with a page</h2><button className="editorial-button mt-5 bg-[var(--editorial-red)] px-5 py-3 font-bold uppercase text-white" onClick={createPage} type="button">Add first page</button></div>}</section>
      <aside className="border border-black bg-white p-5"><h2 className="editorial-display text-xl">Tools</h2><div className="mt-4 grid grid-cols-2 gap-2"><button className="editorial-button border border-black px-3 py-3 text-sm font-bold" disabled={!page} onClick={createText} type="button">+ Text</button><label className={`editorial-button border border-black px-3 py-3 text-center text-sm font-bold ${!page ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>+ Image<input accept="image/avif,image/jpeg,image/png,image/webp" className="sr-only" disabled={!page} onChange={(event) => { void createImage(event.target.files?.[0]); event.target.value = ""; }} type="file" /></label></div>{page ? <BackgroundEditor background={page.background} onChange={(background) => changePage((value) => ({ ...value, background }))} /> : null}{block ? <BlockEditor block={block} onChange={changeBlock} onDelete={() => { changePage((value) => ({ ...value, blocks: value.blocks.filter((item) => item.id !== block.id) })); setBlockId(null); }} /> : <p className="editorial-serif mt-8 text-sm text-black/55">Select a block to edit its content and frame.</p>}</aside>
    </div>
  </main>;
}

function BackgroundEditor({ background, onChange }: { background: PageBackground; onChange: (value: PageBackground) => void }) {
  return <fieldset className="mt-8 border-t border-black/20 pt-5"><legend className="editorial-display text-lg">Background</legend><div className="mt-3 flex gap-2">{backgrounds.map((item) => <button aria-label={`Use ${item.value} background`} className={`h-8 w-8 border ${item.value === background.value ? "border-2 border-[var(--editorial-blue)]" : "border-black"}`} key={item.value} onClick={() => onChange(item)} style={{ background: item.value }} type="button" />)}</div><label className="mt-4 block text-xs font-bold uppercase">Custom color<input className="mt-1 block h-10 w-full" onChange={(event) => onChange({ type: "color", value: event.target.value })} type="color" value={background.type === "color" ? background.value : "#ffffff"} /></label></fieldset>;
}

function BlockEditor({ block, onChange, onDelete }: { block: PageBlock; onChange: (value: Partial<PageBlock>) => void; onDelete: () => void }) {
  return <div className="mt-8 border-t border-black/20 pt-5"><h3 className="editorial-display text-lg capitalize">{block.type} block</h3>{block.type === "text" ? <><label className="mt-4 block text-xs font-bold uppercase">Text<textarea className="mt-1 min-h-24 w-full border border-black p-2 font-normal normal-case" onChange={(event) => onChange({ text: event.target.value })} value={block.text} /></label><label className="mt-3 block text-xs font-bold uppercase">Font<select className="mt-1 w-full border border-black p-2 font-normal normal-case" onChange={(event) => onChange({ fontFamily: event.target.value })} value={block.fontFamily}>{fonts.map((font) => <option key={font}>{font}</option>)}</select></label><label className="mt-3 block text-xs font-bold uppercase">Font size<input className="mt-1 w-full border border-black p-2 font-normal" max={200} min={8} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} type="number" value={block.fontSize} /></label></> : <><label className="mt-4 block text-xs font-bold uppercase">Alt text<input className="mt-1 w-full border border-black p-2 font-normal normal-case" onChange={(event) => onChange({ alt: event.target.value })} value={block.alt} /></label><label className="mt-3 block text-xs font-bold uppercase">Fit<select className="mt-1 w-full border border-black p-2" onChange={(event) => onChange({ objectFit: event.target.value as "cover" | "contain" })} value={block.objectFit}><option value="cover">Fill frame</option><option value="contain">Show whole image</option></select></label></>}<div className="mt-4 grid grid-cols-2 gap-3">{(["x", "y", "width", "height"] as const).map((field) => <label className="text-xs font-bold uppercase" key={field}>{field}<input className="mt-1 w-full border border-black p-2 font-normal" max={100} min={field === "width" || field === "height" ? 1 : 0} onChange={(event) => onChange({ [field]: Number(event.target.value) })} type="number" value={block[field]} /></label>)}</div><button className="editorial-text-link mt-6 text-sm text-red-700" onClick={onDelete} type="button">Remove block</button></div>;
}
