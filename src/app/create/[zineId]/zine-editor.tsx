"use client";

import { type MouseEvent, useEffect, useState, useTransition } from "react";

import type { PageBackground, PageBlock, ZinePalette } from "@/db/schema";
import { createImageBlock, createTextBlock } from "@/lib/zines/blocks";
import { imageAltFromFileName, uploadPageImage } from "@/lib/zines/page-images";
import { sampleImagePalette } from "@/lib/zines/palette-sampler";

import { addPage, deletePage, type EditorPage, savePage, savePalette } from "./actions";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorHeader } from "./components/editor-header";
import { InspectorPanel } from "./components/inspector-panel";
import { LayersPanel } from "./components/layers-panel";
import { PalettePanel } from "./components/palette-panel";
import { PaletteProvider } from "./components/palette-context";
import { PageRail } from "./components/page-rail";

type Zine = {
  id: string;
  title: string;
  aspectWidth: number;
  aspectHeight: number;
  templateKey: string | null;
  palette: ZinePalette;
};

type ZineEditorProps = {
  clerkUserId: string;
  initialPages: EditorPage[];
  zine: Zine;
};

export function ZineEditor({ clerkUserId, initialPages, zine }: ZineEditorProps) {
  const [allPages, setAllPages] = useState(initialPages);
  const [pageId, setPageId] = useState(initialPages[0]?.id ?? null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [palette, setPalette] = useState(zine.palette);
  // Edits live in `allPages` until saved, so a page stays dirty even after the
  // user switches away from it — track ids, not a single current-page flag.
  const [dirtyPageIds, setDirtyPageIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [pending, startTransition] = useTransition();
  const page = allPages.find((item) => item.id === pageId) ?? null;
  const block = page?.blocks.find((item) => item.id === blockId) ?? null;
  const hasUnsavedChanges = dirtyPageIds.size > 0;

  const markPage = (id: string, dirty: boolean) =>
    setDirtyPageIds((items) => {
      const next = new Set(items);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  const changePage = (update: (value: EditorPage) => EditorPage) => {
    if (!page) return;
    setAllPages((items) =>
      items.map((item) => (item.id === page.id ? update(item) : item)),
    );
    markPage(page.id, true);
    setMessage("Unsaved changes");
  };

  const addBlock = (item: PageBlock) => {
    changePage((value) => ({ ...value, blocks: [...value.blocks, item] }));
    setBlockId(item.id);
  };

  // Canvas gestures name their block explicitly: a drag starting on an unselected block
  // selects it in the same event, and that selection hasn't rendered yet.
  const changeBlockById = (id: string, values: Partial<PageBlock>) =>
    changePage((value) => ({
      ...value,
      blocks: value.blocks.map((item) =>
        item.id === id ? ({ ...item, ...values } as PageBlock) : item,
      ),
    }));

  const changeBlock = (values: Partial<PageBlock>) => {
    if (!block) return;
    changeBlockById(block.id, values);
  };

  const removeBlock = () => {
    if (!block) return;
    changePage((value) => ({
      ...value,
      blocks: value.blocks.filter((item) => item.id !== block.id),
    }));
    setBlockId(null);
  };

  useEffect(() => {
    if (!block || !page) return;

    const deleteSelectedBlock = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      event.preventDefault();
      setAllPages((items) =>
        items.map((item) =>
          item.id === page.id
            ? {
                ...item,
                blocks: item.blocks.filter((itemBlock) => itemBlock.id !== block.id),
              }
            : item,
        ),
      );
      setDirtyPageIds((items) => new Set(items).add(page.id));
      setBlockId(null);
      setMessage("Block removed — save the page to keep this change");
    };

    window.addEventListener("keydown", deleteSelectedBlock);
    return () => window.removeEventListener("keydown", deleteSelectedBlock);
  }, [block, page]);

  const moveBlock = (direction: "forward" | "backward") => {
    if (!block) return;
    changePage((value) => {
      const currentIndex = value.blocks.findIndex((item) => item.id === block.id);
      const nextIndex = currentIndex + (direction === "forward" ? 1 : -1);
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= value.blocks.length) {
        return value;
      }

      const blocks = [...value.blocks];
      [blocks[currentIndex], blocks[nextIndex]] = [
        blocks[nextIndex],
        blocks[currentIndex],
      ];
      return { ...value, blocks };
    });
  };

  const selectPage = (id: string) => {
    if (id === pageId) return;
    if (
      page &&
      dirtyPageIds.has(page.id) &&
      !window.confirm(
        "You have unsaved changes on this page. Switch pages without saving?",
      )
    ) {
      return;
    }
    setPageId(id);
    setBlockId(null);
    setMessage(null);
  };

  const guardExit = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      hasUnsavedChanges &&
      !window.confirm("You have unsaved changes. Leave without saving?")
    ) {
      event.preventDefault();
    }
  };

  const createPage = () =>
    startTransition(async () => {
      const result = await addPage(zine.id);
      if (!result.ok || !result.page) {
        return setMessage(result.ok ? "Could not add a page." : result.error);
      }
      setAllPages((items) => [...items, result.page!]);
      setPageId(result.page.id);
      setBlockId(null);
      setMessage("Page added");
    });

  const persistPage = () =>
    page &&
    startTransition(async () => {
      setMessage("Saving…");
      const result = await savePage(zine.id, page.id, page.background, page.blocks);
      if (result.ok) markPage(page.id, false);
      setMessage(result.ok ? "Saved" : result.error);
    });

  const removePage = () =>
    page &&
    window.confirm(`Delete page ${page.pageNumber}?`) &&
    startTransition(async () => {
      const result = await deletePage(zine.id, page.id);
      if (!result.ok) return setMessage(result.error);
      const remaining = allPages.filter((item) => item.id !== page.id);
      markPage(page.id, false);
      setAllPages(remaining);
      setPageId(remaining[0]?.id ?? null);
      setBlockId(null);
      setMessage("Page deleted");
    });

  const createText = () => {
    if (!page) return;
    addBlock(createTextBlock());
  };

  const createImage = async (file: File | undefined) => {
    if (!file || !page) return;
    setMessage("Uploading image…");
    try {
      const sampledPalette = sampleImagePalette(file).catch((error) => {
        console.warn("Image palette sampling failed", error);
        return null;
      });
      const url = await uploadPageImage({ clerkUserId, file });
      addBlock(createImageBlock({ alt: imageAltFromFileName(file.name), url }));
      const sampled = await sampledPalette;
      if (sampled) {
        // A nearly monochrome photo may not contain five distinct sampled buckets;
        // keep the remaining established zine colors instead of inventing new ones.
        const nextPalette = [...new Set([...sampled, ...palette])].slice(0, 5);
        const result = await savePalette(zine.id, nextPalette);
        if (result.ok) setPalette(nextPalette);
      }
      setMessage("Image uploaded — save the page to keep it");
    } catch (error) {
      console.error("Image upload failed", error);
      setMessage("Image upload failed. Use a supported image under 10 MB.");
    }
  };

  return (
    <main className="min-h-screen bg-[#efefec] pb-8">
      <EditorHeader
        message={message}
        onExit={guardExit}
        onSave={persistPage}
        saveDisabled={!page || pending}
        templateKey={zine.templateKey}
        title={zine.title}
      />
      <div className="grid items-start gap-5 p-5 lg:grid-cols-[170px_minmax(320px,1fr)_300px] lg:p-8">
        <PageRail
          canDelete={Boolean(page)}
          disabled={pending}
          onAddPage={createPage}
          onDeletePage={removePage}
          onSelectPage={selectPage}
          pages={allPages}
          selectedPageId={pageId}
        />
        <EditorCanvas
          aspectHeight={zine.aspectHeight}
          aspectWidth={zine.aspectWidth}
          onAddPage={createPage}
          onChangeBlock={changeBlockById}
          onSelectBlock={setBlockId}
          page={page}
          selectedBlockId={blockId}
        />
        <PaletteProvider palette={palette}>
          <div className="grid content-start gap-5">
            <PalettePanel palette={palette} />
            <InspectorPanel
              background={page?.background ?? null}
              block={block}
              onAddImage={(file) => void createImage(file)}
              onAddText={createText}
              onChangeBackground={(background: PageBackground) =>
                changePage((value) => ({ ...value, background }))
              }
              onChangeBlock={changeBlock}
              onDeleteBlock={removeBlock}
            />
            <LayersPanel
              blocks={page?.blocks ?? []}
              onMoveBlock={moveBlock}
              onSelectBlock={setBlockId}
              selectedBlockId={blockId}
            />
          </div>
        </PaletteProvider>
      </div>
    </main>
  );
}
