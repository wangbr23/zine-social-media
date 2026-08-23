# Creation Desk Review

**Date:** 2026-08-23
**What this is:** A synthesis of a three-agent review of the zine creation/editing experience — an implementation audit of `src/app/create/[zineId]/`, competitor research (Canva, Adobe Express, Genially, Flipsnack/Issuu/Joomag, Instagram Stories, Pinterest Shuffles, VSCO, PicCollage/Jodu), and a grounded ideas brainstorm. Full detail from all three agent reports lives in conversation history; this is the condensed, actionable version for the repo.

**Trigger:** The user was unhappy with the current creation experience and wants near-term and differentiating-tier ideas implemented; stretch-tier ideas are deferred. See `TODO.md`'s "Creation experience overhaul" section for the resulting task graph, and `docs/decisions.md`'s 2026-08-23 entries for the two scope calls this prompted.

## Where it stood (audit findings)

The page editor already existed — this was a fix, not a green-field build. The block model was already more capable than its interface: every block already carried free `x`/`y`/`width`/`height`/`rotation`.

- **No dragging.** Position was set via four typed number fields (x/y/width/height as percentages).
- **Three controls already stored but invisible.** Rotation, text color, and text alignment were saved and rendered, with no UI to set any of them.
- **Templates didn't template.** Choosing a starting point only changed a label; every draft started blank.
- **Nothing could bleed.** Every block was clamped inside the page margins server-side — full-bleed images and edge-to-edge type were structurally impossible.
- **Drafts were unreachable after exit.** The editor's exit link went to the profile Drafts tab, but draft cards there weren't links.
- **No autosave, no undo.** Saving was a manual per-page button; closing the tab mid-edit silently dropped unsaved work.
- **`zine-editor.tsx` was already a god file** by this repo's own coding standard — page state, block state, upload, persistence, and all rendering/editing UI mixed in one component. Sequencing below treats decomposing it as the prerequisite for adding anything new.

## What the best tools get right (competitor research highlights)

Pure flipbook publishers (Issuu, Joomag, Flipsnack) turned out to be the weakest reference — their creation tools are an afterthought to distribution. The strongest signal came from design canvases (Canva, Genially) and mobile collage/social apps (Instagram Stories, Pinterest Shuffles, VSCO):

1. **The reroll, not the redo** — Canva's palette/font "shuffle" turns a design decision the user isn't qualified to make into one they're qualified to judge.
2. **No panel, just gestures** — Instagram Stories has no layers panel at all; reordering is a long-press.
3. **Texture as physics** — washi tape, torn paper, Polaroid frames make placement feel like doing something, not filling out a form.
4. **Cut, don't compose** — one-tap subject cutout is the digital equivalent of scissors; Pinterest measured 3× engagement on AI-assisted collages vs. static posts.
5. **Permission to be imperfect** — Shuffles is pitched as "a creative haven away from the pressure to be perfect"; zine culture treats the smudge as proof of authorship.
6. **Remix as the on-ramp** — copying someone's layout and swapping in your own material solves the blank page (stretch-tier here, not built this round).
7. **A name, not a slider** — VSCO sells "Portra 400," never "+12 contrast."
8. **Nobody currently owns both ends** — Canva animates a page but can't produce a flipbook; Issuu/Flipsnack produce flipbooks but animation dies in the export. Owning creation *and* the reader view avoids that seam.

## What's being built (near-term + differentiating)

See `TODO.md` for the authoritative, dependency-ordered task list (`T24`–`T36`). Summary:

**Near-term (foundational):** decompose the editor into a shared `PageRenderer` + canvas/inspector/toolbar/page-rail components; fix the coordinate system to a stable page-unit model; direct manipulation (drag/resize/rotate); expose the already-stored controls (color, alignment, rotation) and allow bleed; real starter templates; a per-zine palette system; make drafts reachable again; an unsaved-changes exit warning.

**Differentiating:** a curated sticker/shape tray; image frame/mask presets and non-destructive filters tied to the palette; an auto-arrange "shuffle this page" composition generator; a layers panel; page-turn transitions in the reader (blocked on `T17`, the reader view, which doesn't exist yet).

**Explicitly deferred (stretch-tier, not in this round):** remix a published zine into a new draft, AI-assisted layout suggestions, real-time collaborative editing, print export/physical copies.

## Decisions this reopened

Two scope calls came out of this review and are logged in full in `docs/decisions.md`:

- **Stickers/shapes are back in v1**, superseding the earlier "no stickers/shapes/embeds" call — a small curated shape/sticker block type, not a generic embed system.
- **The editor targets desktop first** — mouse/trackpad precision, hover states, a persistent side rail. Usable but not optimized on touch this round.

One open question from the original review was resolved by the desktop-first decision (device target). A smaller one raised but not yet acted on: whether a draft should be allowed to change its aspect ratio before publish (today it's locked at creation forever; since coordinates are percentages, relaxing this for drafts only looked safe but wasn't included in this task graph).
