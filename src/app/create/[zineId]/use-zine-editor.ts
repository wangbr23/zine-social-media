"use client";

import { type MouseEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { PageBlock, ShapeKind, ZinePalette } from "@/db/schema";
import {
  AUTO_ARRANGE_LAYOUTS,
  autoArrangeImages,
} from "@/lib/zines/auto-arrange";
import {
  applyPageBlockPatch,
  createImageBlock,
  createShapeBlock,
  createTextBlock,
  type PageBlockPatch,
} from "@/lib/zines/blocks";
import { deleteDraftZine } from "@/lib/zines/draft-actions";
import {
  imageAltFromFileName,
  PageImageUploadError,
  uploadPageImage,
} from "@/lib/zines/page-images";
import { sampleImagePalette } from "@/lib/zines/palette-sampler";
import { zinePaletteFrom } from "@/lib/zines/palettes";

import {
  addPage,
  deletePage,
  type EditorPage,
  publishZine,
  savePage,
  savePalette,
} from "./actions";

export type EditorZine = {
  id: string;
  title: string;
  aspectWidth: number;
  aspectHeight: number;
  templateKey: string | null;
  palette: ZinePalette;
};

type Options = { clerkUserId: string; initialPages: EditorPage[]; zine: EditorZine };

export function useZineEditor({ clerkUserId, initialPages, zine }: Options) {
  const router = useRouter();
  const nextLayoutIndex = useRef(0);
  const [allPages, setAllPages] = useState(initialPages);
  const [pageId, setPageId] = useState(initialPages[0]?.id ?? null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [palette, setPalette] = useState(zine.palette);
  // Edits live in `allPages` until saved, so a page stays dirty even after the
  // user switches away from it — track ids, not a single current-page flag.
  const [dirtyPageIds, setDirtyPageIds] = useState<ReadonlySet<string>>(() => new Set());
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
    setAllPages((items) => items.map((item) => (item.id === page.id ? update(item) : item)));
    markPage(page.id, true);
    setMessage("Unsaved changes");
  };

  const addBlock = (item: PageBlock) => {
    changePage((value) => ({ ...value, blocks: [...value.blocks, item] }));
    setBlockId(item.id);
  };

  // A drag can select and change a block in the same event, before selection rerenders.
  const changeBlockById = (id: string, values: PageBlockPatch) =>
    changePage((value) => ({
      ...value,
      blocks: value.blocks.map((item) =>
        item.id === id ? applyPageBlockPatch(item, values) : item,
      ),
    }));

  const changeBlock = (values: PageBlockPatch) => {
    if (block) changeBlockById(block.id, values);
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
      ) return;

      event.preventDefault();
      setAllPages((items) =>
        items.map((item) =>
          item.id === page.id
            ? { ...item, blocks: item.blocks.filter((itemBlock) => itemBlock.id !== block.id) }
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
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= value.blocks.length) return value;
      const blocks = [...value.blocks];
      [blocks[currentIndex], blocks[nextIndex]] = [blocks[nextIndex], blocks[currentIndex]];
      return { ...value, blocks };
    });
  };

  const selectPage = (id: string) => {
    if (id === pageId) return;
    if (
      page && dirtyPageIds.has(page.id) &&
      !window.confirm("You have unsaved changes on this page. Switch pages without saving?")
    ) return;
    setPageId(id);
    setBlockId(null);
    setMessage(null);
  };

  const guardExit = (event: MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Leave without saving?")) {
      event.preventDefault();
    }
  };

  const removeDraft = () => {
    if (!window.confirm(`Delete “${zine.title}” permanently? All of its pages will be removed. This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteDraftZine(zine.id);
      if (!result.ok) return setMessage(result.error);
      setDirtyPageIds(new Set());
      router.replace("/profile?tab=drafts");
      router.refresh();
    });
  };

  const createPage = () => startTransition(async () => {
    const result = await addPage(zine.id);
    if (!result.ok) return setMessage(result.error);
    setAllPages((items) => [...items, result.page]);
    setPageId(result.page.id);
    setBlockId(null);
    setMessage("Page added");
  });

  const persistPage = () => page && startTransition(async () => {
    setMessage("Saving…");
    const result = await savePage(zine.id, page.id, page.background, page.blocks);
    if (result.ok) markPage(page.id, false);
    setMessage(result.ok ? "Saved" : result.error);
  });

  const publish = () => {
    if (hasUnsavedChanges) {
      setMessage("Save every changed page before publishing.");
      return;
    }
    if (!window.confirm(`Publish “${zine.title}”? Published zines cannot be edited.`)) return;

    startTransition(async () => {
      setMessage("Publishing…");
      const result = await publishZine(zine.id);
      if (!result.ok) return setMessage(result.error);
      router.replace("/profile");
      router.refresh();
    });
  };

  const removePage = () => page && window.confirm(`Delete page ${page.pageNumber}?`) && startTransition(async () => {
    const result = await deletePage(zine.id, page.id);
    if (!result.ok) return setMessage(result.error);
    const remaining = allPages.filter((item) => item.id !== page.id);
    markPage(page.id, false);
    setAllPages(remaining);
    setPageId(remaining[0]?.id ?? null);
    setBlockId(null);
    setMessage("Page deleted");
  });

  const createText = () => page && addBlock(createTextBlock());

  const createShape = (shape: ShapeKind, color: string) =>
    page && addBlock(createShapeBlock(shape, color));

  const autoArrange = () => {
    if (!page || !page.blocks.some((item) => item.type === "image")) return;
    const layout = AUTO_ARRANGE_LAYOUTS[nextLayoutIndex.current];
    nextLayoutIndex.current = (nextLayoutIndex.current + 1) % AUTO_ARRANGE_LAYOUTS.length;
    changePage((value) => ({
      ...value,
      blocks: autoArrangeImages(value.blocks, layout.key),
    }));
    setMessage(`${layout.label} applied — save the page to keep it`);
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
        const nextPalette = zinePaletteFrom([...sampled, ...palette]);
        if (nextPalette) {
          const result = await savePalette(zine.id, nextPalette);
          if (result.ok) setPalette(nextPalette);
        }
      }
      setMessage("Image uploaded — save the page to keep it");
    } catch (error) {
      console.error("Image upload failed", error);
      const messages = {
        invalid_type: "Choose a JPEG, PNG, WebP, or AVIF image.",
        too_large: "Choose an image smaller than 10 MB.",
        unauthorized: "Your session expired. Sign in again before uploading.",
        unavailable: "Image uploads are temporarily unavailable. Try again shortly.",
        network: "The image upload lost its network connection. Try again.",
        upload_failed: "The image could not be uploaded. Try again.",
      } as const;
      setMessage(
        error instanceof PageImageUploadError
          ? messages[error.code]
          : messages.upload_failed,
      );
    }
  };

  return {
    allPages, autoArrange, block, blockId, changeBlock, changeBlockById, changePage, createImage,
    createPage, createShape, createText, guardExit, message, moveBlock, page, pageId, palette,
    pending, persistPage, publish, removeBlock, removeDraft, removePage, selectBlock: setBlockId,
    selectPage,
  };
}
