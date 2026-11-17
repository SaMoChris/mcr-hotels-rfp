"use client";

import { useState } from "react";
import { api, useLoad } from "@/lib/client";
import { when } from "@/lib/format";
import { Notice, PageHeader } from "./AppShell";

type Change = { field: string; from: string | null; to: string | null; long?: boolean };
export type HistoryItem = {
  id: number;
  area: string;
  action: string;
  title: string;
  who: string;
  at: string;
  changes: Change[];
  canRevert: boolean;
};
type Page = { items: HistoryItem[]; more: boolean; people: { id: number; name: string }[]; areas: Record<string, string> };

/** Turns one entry into a plain sentence: who did what. */
function sentence(h: HistoryItem): React.ReactNode {
  const what = <strong className="font-semibold">{h.title}</strong>;
  const thing = h.area === "task" ? "task" : "question";
  if (h.area === "profile") {
    return h.action === "create" ? <>joined the project</> : <>changed their display name</>;
  }
  if (h.area === "model") {
    if (h.action === "reset") return <>reset {what} to its starting value</>;
    if (h.action === "revert") return <>undid a change to {what}</>;
    return <>changed {what}</>;
  }
  if (h.area === "doc") {
    if (h.action === "reset") return <>restored the starting text of {what}</>;
    if (h.action === "revert") return <>undid an edit to {what}</>;
    return <>edited {what}</>;
  }
  if (h.action === "create") return <>added the {thing} {what}</>;
  if (h.action === "delete") return <>deleted the {thing} {what}</>;
  if (h.action === "restore") return <>restored the {thing} {what}</>;
  if (h.action === "revert") return <>undid a change to the {thing} {what}</>;
  return <>updated the {thing} {what}</>;
}

function ChangeLine({ c }: { c: Change }) {
  if (c.long) {
    return (
      <details className="mt-1 text-sm">
        <summary className="cursor-pointer text-rust">{c.field}: show before and after</summary>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {[
            ["Before", c.from],
            ["After", c.to],
          ].map(([label, text]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-mute">{label}</p>
              <pre className="mt-1 max-h-72 overflow-auto rounded border border-line bg-white p-2 font-mono text-xs whitespace-pre-wrap">
                {text || "(empty)"}
              </pre>
            </div>
          ))}
        </div>
      </details>
    );
  }
  return (
    <p className="num mt-0.5 text-sm text-graphite">
      {c.field}: {c.from ?? "(empty)"} <span aria-label="changed to">→</span>{" "}
      <span className="font-semibold text-ink">{c.to ?? "(empty)"}</span>
    </p>
  );
}

export function HistoryList({
  items,
  onUndo,
  busyId,
}: {
  items: HistoryItem[];
  onUndo?: (id: number) => void;
  busyId?: number | null;
}) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {items.map((h) => (
        <li key={h.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-3">
          <div className="min-w-0 flex-1">
            <p>
              <span className="font-semibold">{h.who}</span> {sentence(h)}
            </p>
            {h.changes.map((c, i) => (
              <ChangeLine key={i} c={c} />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-mute">
            <time dateTime={h.at}>{when(h.at)}</time>
            {onUndo && h.canRevert && h.action !== "revert" && (
              <button onClick={() => onUndo(h.id)} disabled={busyId === h.id} className="btn btn-quiet btn-small">
                {busyId === h.id ? "Undoing…" : "Undo"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HistoryView() {
  const [area, setArea] = useState("");
  const [person, setPerson] = useState("");
  const [limit, setLimit] = useState(50);
  const [problem, setProblem] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const q = new URLSearchParams({ limit: String(limit) });
  if (area) q.set("area", area);
  if (person) q.set("user", person);
  const { data: page, error: loadError, reload } = useLoad<Page>(`/api/history?${q}`, 30_000);
  const error = problem ?? loadError;

  async function undo(id: number) {
    setBusyId(id);
    setNote(null);
    setProblem(null);
    try {
      await api(`/api/history/${id}/revert`, { method: "POST" });
      setNote("Undone. The undo is recorded at the top of the history.");
      await reload();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Couldn't undo that change.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="History"
        lead="Every saved change, newest first: who made it, when, and what it was before. Undo puts the earlier value back and records that too."
      />
      <div className="mb-5 flex flex-wrap gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Area</span>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="field min-w-[11rem]">
            <option value="">Everything</option>
            {Object.entries(page?.areas ?? {}).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Person</span>
          <select value={person} onChange={(e) => setPerson(e.target.value)} className="field min-w-[11rem]">
            <option value="">Everyone</option>
            {(page?.people ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {note && <Notice kind="info">{note}</Notice>}
      {!page ? (
        !error && <p className="text-mute">Loading the history…</p>
      ) : page.items.length === 0 ? (
        <p className="mt-4 text-graphite">
          No changes here yet. Edit an input on the Pricing model page and it shows up in this list.
        </p>
      ) : (
        <div className="mt-4">
          <HistoryList items={page.items} onUndo={undo} busyId={busyId} />
          {page.more &&
            (limit < 200 ? (
              <button onClick={() => setLimit((n) => Math.min(n + 50, 200))} className="btn btn-quiet mt-5">
                Show older changes
              </button>
            ) : (
              <p className="mt-4 text-sm text-mute">
                Showing the latest 200 changes. Filter by area or person to find older ones.
              </p>
            ))}
        </div>
      )}
    </>
  );
}
