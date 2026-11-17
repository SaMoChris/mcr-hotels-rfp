"use client";

import { useState } from "react";
import { api, useLoad } from "@/lib/client";
import { when } from "@/lib/format";
import { Notice, PageHeader } from "./AppShell";
import { Markdown } from "./Markdown";

type Section = { key: string; title: string; body: string; edited: boolean; by: string | null; at: string | null };
type Doc = { doc: string; title: string; description: string; sections: Section[] };

export function DocView({ doc }: { doc: string }) {
  const { data, setData, error, pause } = useLoad<Doc>(`/api/docs/${doc}`, 45_000);
  const [editing, setEditing] = useState<string | null>(null);

  function startEditing(key: string | null) {
    setEditing(key);
    pause(key !== null);
  }

  async function save(key: string, payload: { title: string; body: string } | { reset: true }): Promise<string | null> {
    try {
      const r = await api<{ sections: Section[] }>(`/api/docs/${doc}`, { method: "PUT", body: { key, ...payload } });
      setData((d) => (d ? { ...d, sections: r.sections } : d));
      startEditing(null);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Couldn't save. Try again.";
    }
  }

  if (!data) {
    return (
      <>
        <PageHeader title={doc === "rfp" ? "Draft RFP" : "Scope and requirements"} />
        {error ? <Notice kind="error">{error}</Notice> : <p className="text-mute">Loading the document…</p>}
      </>
    );
  }

  return (
    <>
      <PageHeader title={data.title} lead={`${data.description} Edit any section; changes are saved under your name.`} />
      {error && <Notice kind="error">{error}</Notice>}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-12">
        <div className="min-w-0">
          {data.sections.map((s) => (
            <SectionBlock
              key={s.key}
              section={s}
              editing={editing === s.key}
              locked={editing !== null && editing !== s.key}
              onEdit={() => startEditing(s.key)}
              onCancel={() => startEditing(null)}
              onSave={(p) => save(s.key, p)}
            />
          ))}
        </div>
        <nav aria-label="Sections in this document" className="hidden xl:block">
          <div className="sticky top-10 max-h-[80vh] overflow-y-auto text-sm">
            <p className="mb-2 font-semibold">In this document</p>
            <ul className="space-y-1.5 border-l border-line">
              {data.sections.map((s) => (
                <li key={s.key}>
                  <a href={`#${s.key}`} className="-ml-px block border-l border-transparent pl-3 text-graphite hover:border-ember hover:text-ink">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
}

function SectionBlock(props: {
  section: Section;
  editing: boolean;
  locked: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (p: { title: string; body: string } | { reset: true }) => Promise<string | null>;
}) {
  const s = props.section;
  const [title, setTitle] = useState(s.title);
  const [body, setBody] = useState(s.body);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function run(p: { title: string; body: string } | { reset: true }) {
    setBusy(true);
    setProblem(await props.onSave(p));
    setBusy(false);
  }

  return (
    <section id={s.key} className="scroll-mt-8 border-t border-line py-7 first:border-t-0 first:pt-0">
      {props.editing ? (
        <div>
          <label className="block text-sm font-semibold" htmlFor={`title-${s.key}`}>
            Section title
          </label>
          <input id={`title-${s.key}`} value={title} onChange={(e) => setTitle(e.target.value)} className="field mt-1 max-w-xl" />
          <div className="mt-4 flex items-center justify-between gap-4">
            <label className="text-sm font-semibold" htmlFor={`body-${s.key}`}>
              Text (Markdown)
            </label>
            <button type="button" onClick={() => setPreview((v) => !v)} className="link text-sm">
              {preview ? "Back to editing" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="mt-2 rounded-md border border-line bg-white p-4">
              <Markdown text={body} wide />
            </div>
          ) : (
            <textarea
              id={`body-${s.key}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={Math.min(Math.max(body.split("\n").length + 2, 8), 32)}
              className="field mt-1 font-mono text-[0.85rem] leading-relaxed"
              spellCheck
            />
          )}
          {problem && (
            <p role="alert" className="mt-2 text-sm text-bad">
              {problem}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => run({ title, body })} disabled={busy} className="btn btn-primary">
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={() => {
                setTitle(s.title);
                setBody(s.body);
                setProblem(null);
                props.onCancel();
              }}
              disabled={busy}
              className="btn btn-quiet"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="display text-[1.3rem]" style={{ fontStretch: "112%" }}>
              {s.title}
            </h2>
            <div className="flex items-center gap-3 text-sm">
              {s.edited && s.at && (
                <span className="text-mute">
                  Edited by {s.by ?? "someone"}, {when(s.at)}
                </span>
              )}
              {s.edited && (
                <button onClick={() => run({ reset: true })} disabled={busy || props.locked} className="link">
                  Restore starting text
                </button>
              )}
              <button
                onClick={() => {
                  setTitle(s.title);
                  setBody(s.body);
                  setPreview(false);
                  props.onEdit();
                }}
                disabled={props.locked}
                className="btn btn-quiet btn-small"
              >
                Edit section
              </button>
            </div>
          </div>
          {problem && (
            <p role="alert" className="mb-2 text-sm text-bad">
              {problem}
            </p>
          )}
          <Markdown text={s.body} wide />
        </>
      )}
    </section>
  );
}
