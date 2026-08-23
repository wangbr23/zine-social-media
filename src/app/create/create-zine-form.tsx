"use client";

import { useActionState } from "react";

import { ZINE_ASPECT_RATIOS, ZINE_TEMPLATES } from "@/lib/zines/options";

import { createZine, type CreateZineState } from "./actions";

const initialState: CreateZineState = {};

export function CreateZineForm() {
  const [state, formAction, pending] = useActionState(createZine, initialState);
  const selectedRatio = state.values?.aspectRatio ?? "portrait";
  const selectedTemplate = state.values?.template ?? "blank";

  return (
    <form action={formAction} className="mt-10 space-y-10">
      {state.errors?.form ? (
        <p className="border-l-4 border-[var(--editorial-red)] bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.form}
        </p>
      ) : null}

      <div>
        <label className="editorial-display block text-xl" htmlFor="title">
          Issue title
        </label>
        <input
          aria-describedby={state.errors?.title ? "title-error" : undefined}
          aria-invalid={Boolean(state.errors?.title)}
          autoFocus
          className="editorial-serif mt-2 w-full border-0 border-b-2 border-black bg-white px-0 py-3 text-2xl outline-none focus:border-[var(--editorial-blue)] md:text-3xl"
          defaultValue={state.values?.title}
          id="title"
          maxLength={120}
          name="title"
          placeholder="The first issue"
          required
        />
        {state.errors?.title ? <p className="mt-2 text-sm text-red-700" id="title-error">{state.errors.title}</p> : null}
      </div>

      <fieldset>
        <legend className="editorial-display text-xl">Page shape</legend>
        <p className="editorial-serif mt-1 text-black/60">This stays fixed for the whole issue.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {ZINE_ASPECT_RATIOS.map((ratio) => (
            <label className="cursor-pointer" key={ratio.key}>
              <input className="peer sr-only" defaultChecked={ratio.key === selectedRatio} name="aspectRatio" type="radio" value={ratio.key} />
              <span className="flex min-h-28 items-end border border-black p-4 transition peer-checked:bg-black peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[var(--editorial-blue)]">
                <span><b className="editorial-display block text-lg">{ratio.label}</b><small>{ratio.width}:{ratio.height} · {ratio.detail}</small></span>
              </span>
            </label>
          ))}
        </div>
        {state.errors?.aspectRatio ? <p className="mt-2 text-sm text-red-700">{state.errors.aspectRatio}</p> : null}
      </fieldset>

      <fieldset>
        <legend className="editorial-display text-xl">Starting point</legend>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {ZINE_TEMPLATES.map((template, index) => (
            <label className="cursor-pointer" key={template.key}>
              <input className="peer sr-only" defaultChecked={template.key === selectedTemplate} name="template" type="radio" value={template.key} />
              <span className="block border border-black p-4 transition peer-checked:border-[var(--editorial-red)] peer-checked:bg-red-50 peer-checked:shadow-[4px_4px_0_#ef2d32] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[var(--editorial-blue)]">
                <small className="font-bold text-[var(--editorial-muted)]">0{index + 1}</small>
                <b className="editorial-display mt-6 block text-xl">{template.label}</b>
                <span className="editorial-serif mt-1 block text-sm text-black/65">{template.detail}</span>
              </span>
            </label>
          ))}
        </div>
        {state.errors?.template ? <p className="mt-2 text-sm text-red-700">{state.errors.template}</p> : null}
      </fieldset>

      <button className="editorial-button w-full bg-[var(--editorial-red)] px-5 py-4 font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Making your draft…" : "Create draft"}
      </button>
    </form>
  );
}
