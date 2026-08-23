"use client";

import { useState, useTransition } from "react";

import type { PageBackground, PageBlock } from "@/db/schema";
import { createImageBlock, createTextBlock } from "@/lib/zines/blocks";
import { imageAltFromFileName, uploadPageImage } from "@/lib/zines/page-images";

import { addPage, deletePage, type EditorPage, savePage } from "./actions";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorHeader } from "./components/editor-header";
import { InspectorPanel } from "./components/inspector-panel";
import { PageRail } from "./components/page-rail";

type Zine = {
  id: string;
  title: string;
  aspectWidth: number;
  aspectHeight: number;
  templateKey: string | null;
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
  const [pending, startTransition] = useTransition();
  const page = allPages.find((item) => item.id === pageId) ?? null;
  const block = page?.blocks.find((item) => item.id === blockId) ?? null;

  const changePage = (update: (value: EditorPage) => EditorPage) => {
    if (!page) return;
    setAllPages((items) =>
      items.map((item) => (item.id === page.id ? update(item) : item)),
    );
    setMessage("Unsaved changes");
  };

  const addBlock = (item: PageBlock) => {
    changePage((value) => ({ ...value, blocks: [...value.blocks, item] }));
    setBlockId(item.id);
  };

  const changeBlock = (values: Partial<PageBlock>) => {
    if (!block) return;
    changePage((value) => ({
      ...value,
      blocks: value.blocks.map((item) =>
        item.id === block.id ? ({ ...item, ...values } as PageBlock) : item,
      ),
    }));
  };

  const removeBlock = () => {
    if (!block) return;
    changePage((value) => ({
      ...value,
      blocks: value.blocks.filter((item) => item.id !== block.id),
    }));
    setBlockId(null);
  };

  const selectPage = (id: string) => {
    setPageId(id);
    setBlockId(null);
    setMessage(null);
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
      setMessage(result.ok ? "Saved" : result.error);
    });

  const removePage = () =>
    page &&
    window.confirm(`Delete page ${page.pageNumber}?`) &&
    startTransition(async () => {
      const result = await deletePage(zine.id, page.id);
      if (!result.ok) return setMessage(result.error);
      const remaining = allPages.filter((item) => item.id !== page.id);
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
      const url = await uploadPageImage({ clerkUserId, file });
      addBlock(createImageBlock({ alt: imageAltFromFileName(file.name), url }));
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
        onSave={persistPage}
        saveDisabled={!page || pending}
        templateKey={zine.templateKey}
        title={zine.title}
      />
      <div className="grid gap-5 p-5 lg:grid-cols-[170px_minmax(320px,1fr)_300px] lg:p-8">
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
          onSelectBlock={setBlockId}
          page={page}
          selectedBlockId={blockId}
        />
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
      </div>
    </main>
  );
}
