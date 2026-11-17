"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { api, useLoad } from "@/lib/client";
import { formatValue, fromEditable, toEditable, when } from "@/lib/format";
import { compute, type ModelResult } from "@/lib/model/calc";
import type { ModelPayload } from "@/lib/model/types";

type Ctx = {
  model: ModelPayload;
  result: ModelResult;
  /** Saves one input; `null` resets it. Returns an error message, or null when saved. */
  save: (key: string, value: number | null) => Promise<string | null>;
};

const ModelContext = createContext<Ctx | null>(null);

export function useModel(): Ctx {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel needs a ModelProvider above it.");
  return ctx;
}

/** Loads the shared model, refreshes it every 20 seconds, and exposes `save`. */
export function useModelLoader() {
  const { data, setData, error, reload, pause } = useLoad<ModelPayload>("/api/model", 20_000);
  const pending = useRef(0);

  const save = useCallback(
    async (key: string, value: number | null): Promise<string | null> => {
      pending.current += 1;
      pause(true);
      // Show the new number straight away; the server's answer replaces it.
      setData((d) => (d ? { ...d, values: { ...d.values, [key]: value ?? d.inputs[key].def } } : d));
      try {
        const next = await api<ModelPayload>("/api/model", {
          method: "PUT",
          body: value === null ? { key, reset: true } : { key, value },
        });
        if (pending.current === 1) setData(next);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Couldn't save. Try again.";
      } finally {
        pending.current -= 1;
        if (pending.current === 0) {
          pause(false);
          void reload();
        }
      }
    },
    [pause, reload, setData],
  );

  const ctx = useMemo<Ctx | null>(
    () => (data ? { model: data, result: compute(data.defs, data.values), save } : null),
    [data, save],
  );
  return { ctx, error };
}

export function ModelProvider({ ctx, children }: { ctx: Ctx; children: React.ReactNode }) {
  return <ModelContext.Provider value={ctx}>{children}</ModelContext.Provider>;
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 8a5 5 0 1 0 1.6-3.7" strokeLinecap="round" />
      <path d="M2.5 2.5v3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** One editable model input. Saves when you leave the field or press Enter. */
export function NumberCell({ k, label }: { k: string; label?: string }) {
  const { model, save } = useModel();
  const meta = model.inputs[k];
  const value = model.values[k];
  const changed = model.overrides[k];
  const [draft, setDraft] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const cancel = useRef(false);

  if (!meta) return null;
  const name = label ?? meta.label;
  const hint = changed
    ? `Changed by ${changed.by}, ${when(changed.at)}. Starting value ${formatValue(meta.def, meta.format)}.`
    : undefined;

  async function commit(text: string) {
    const parsed = fromEditable(text, meta.format);
    if (parsed === null) return setProblem("Enter a number.");
    if (parsed < meta.min || parsed > meta.max) {
      return setProblem(`Enter ${formatValue(meta.min, meta.format)} to ${formatValue(meta.max, meta.format)}.`);
    }
    setProblem(null);
    setDraft(null);
    if (parsed !== value) setProblem(await save(k, parsed));
  }

  const reset = changed ? (
    <button
      type="button"
      onClick={async () => setProblem(await save(k, null))}
      title={`Reset to ${formatValue(meta.def, meta.format)}`}
      aria-label={`Reset ${name} to ${formatValue(meta.def, meta.format)}`}
      className="cursor-pointer rounded p-0.5 text-mute hover:text-ember"
    >
      <ResetIcon />
    </button>
  ) : null;

  if (meta.format === "flag") {
    return (
      <span className="inline-flex items-center justify-end gap-1" title={hint}>
        {reset}
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={value > 0}
            onChange={async (e) => setProblem(await save(k, e.target.checked ? 1 : 0))}
            aria-label={name}
            className="h-4 w-4 accent-[#d84315]"
          />
          <span className={changed ? "font-semibold" : ""}>{value > 0 ? "Yes" : "No"}</span>
        </label>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end">
      <span className="inline-flex items-center gap-1">
        {reset}
        <input
          className="cell"
          inputMode="decimal"
          aria-label={name}
          aria-invalid={problem ? true : undefined}
          data-changed={changed ? "true" : undefined}
          data-invalid={problem ? "true" : undefined}
          title={hint}
          value={draft ?? formatValue(value, meta.format)}
          onFocus={(e) => {
            setDraft(toEditable(value, meta.format));
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            if (cancel.current) {
              cancel.current = false;
              setDraft(null);
              setProblem(null);
            } else void commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              cancel.current = true;
              e.currentTarget.blur();
            }
          }}
        />
      </span>
      {problem && (
        <span role="alert" className="mt-0.5 max-w-[11rem] text-right text-xs text-bad">
          {problem}
        </span>
      )}
    </span>
  );
}
