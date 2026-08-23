"use client";

import type { PageBackground } from "@/db/schema";

import type { EditorPage } from "./actions";
import { EditorCanvas } from "./components/editor-canvas";
import { EditorHeader } from "./components/editor-header";
import { InspectorPanel } from "./components/inspector-panel";
import { LayersPanel } from "./components/layers-panel";
import { PalettePanel } from "./components/palette-panel";
import { PaletteProvider } from "./components/palette-context";
import { PageRail } from "./components/page-rail";
import { type EditorZine, useZineEditor } from "./use-zine-editor";

type ZineEditorProps = {
  clerkUserId: string;
  initialPages: EditorPage[];
  zine: EditorZine;
};

export function ZineEditor(props: ZineEditorProps) {
  const editor = useZineEditor(props);
  const { zine } = props;

  return (
    <main className="min-h-screen bg-[#efefec] pb-8">
      <EditorHeader
        message={editor.message}
        onDeleteDraft={editor.removeDraft}
        onExit={editor.guardExit}
        onPublish={editor.publish}
        onSave={editor.persistPage}
        publishDisabled={!editor.page || editor.pending}
        saveDisabled={!editor.page || editor.pending}
        templateKey={zine.templateKey}
        title={zine.title}
      />
      <div className="grid items-start gap-5 p-5 lg:grid-cols-[170px_minmax(320px,1fr)_300px] lg:p-8">
        <PageRail
          canDelete={Boolean(editor.page)}
          disabled={editor.pending}
          onAddPage={editor.createPage}
          onDeletePage={editor.removePage}
          onSelectPage={editor.selectPage}
          pages={editor.allPages}
          selectedPageId={editor.pageId}
        />
        <EditorCanvas
          aspectHeight={zine.aspectHeight}
          aspectWidth={zine.aspectWidth}
          onAddPage={editor.createPage}
          onChangeBlock={editor.changeBlockById}
          onSelectBlock={editor.selectBlock}
          page={editor.page}
          selectedBlockId={editor.blockId}
        />
        <PaletteProvider palette={editor.palette}>
          <div className="grid content-start gap-5">
            <PalettePanel palette={editor.palette} />
            <InspectorPanel
              background={editor.page?.background ?? null}
              block={editor.block}
              canAutoArrange={Boolean(
                editor.page?.blocks.some((block) => block.type === "image"),
              )}
              onAddImage={(file) => void editor.createImage(file)}
              onAddShape={editor.createShape}
              onAddText={editor.createText}
              onAutoArrange={editor.autoArrange}
              onChangeBackground={(background: PageBackground) =>
                editor.changePage((value) => ({ ...value, background }))
              }
              onChangeBlock={editor.changeBlock}
              onDeleteBlock={editor.removeBlock}
            />
            <LayersPanel
              blocks={editor.page?.blocks ?? []}
              onMoveBlock={editor.moveBlock}
              onSelectBlock={editor.selectBlock}
              selectedBlockId={editor.blockId}
            />
          </div>
        </PaletteProvider>
      </div>
    </main>
  );
}
