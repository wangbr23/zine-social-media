"use client";

import { useActionState } from "react";

import {
  completeOnboarding,
  type OnboardingState,
} from "./actions";

const initialState: OnboardingState = {};

type OnboardingFormProps = {
  defaultDisplayName: string;
  defaultHandle: string;
};

export function OnboardingForm({
  defaultDisplayName,
  defaultHandle,
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-7">
      {state.errors?.form ? (
        <p className="border-l-4 border-[var(--editorial-red)] bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.form}
        </p>
      ) : null}

      <div>
        <label className="editorial-display block text-lg" htmlFor="displayName">
          Display name
        </label>
        <input
          aria-describedby={
            state.errors?.displayName ? "displayName-error" : undefined
          }
          aria-invalid={Boolean(state.errors?.displayName)}
          className="mt-2 w-full border-0 border-b border-black bg-white px-0 py-2 outline-none focus:border-[var(--editorial-blue)]"
          defaultValue={state.values?.displayName ?? defaultDisplayName}
          id="displayName"
          maxLength={80}
          name="displayName"
          required
        />
        {state.errors?.displayName ? (
          <p className="mt-2 text-sm text-red-700" id="displayName-error">
            {state.errors.displayName}
          </p>
        ) : null}
      </div>

      <div>
        <label className="editorial-display block text-lg" htmlFor="handle">
          Handle
        </label>
        <div className="mt-2 flex border-b border-black bg-white focus-within:border-[var(--editorial-blue)]">
          <span className="py-2 pr-1 text-black/50">@</span>
          <input
            aria-describedby={state.errors?.handle ? "handle-error" : "handle-help"}
            aria-invalid={Boolean(state.errors?.handle)}
            autoCapitalize="none"
            autoCorrect="off"
            className="min-w-0 flex-1 py-2 outline-none"
            defaultValue={state.values?.handle ?? defaultHandle}
            id="handle"
            maxLength={30}
            minLength={3}
            name="handle"
            pattern="[a-z0-9_]{3,30}"
            required
            spellCheck={false}
          />
        </div>
        <p className="mt-2 text-sm text-black/60" id="handle-help">
          3–30 lowercase letters, numbers, or underscores.
        </p>
        {state.errors?.handle ? (
          <p className="mt-2 text-sm text-red-700" id="handle-error">
            {state.errors.handle}
          </p>
        ) : null}
      </div>

      <button
        className="editorial-button w-full bg-[var(--editorial-red)] px-5 py-3 font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating your profile…" : "Create my magazine"}
      </button>
    </form>
  );
}
