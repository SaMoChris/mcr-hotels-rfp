"use client";

import { useState } from "react";
import { api, useLoad } from "@/lib/client";
import { Notice, PageHeader } from "./AppShell";

type Task = { id: number; title: string; phase: string; owner: string; status: string; due: string | null; notes: string };
type Question = { id: number; question: string; audience: string; owner: string; status: string; answer: string };
type Project = {
  tasks: Task[];
  questions: Question[];
  options: { phases: string[]; statuses: string[]; audiences: string[] };
};

const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  doing: "In progress",
  blocked: "Blocked",
  done: "Done",
  open: "Open",
  answered: "Answered",
};

const STATUS_STYLE: Record<string, string> = {
  todo: "border-line bg-white text-graphite",
  open: "border-line bg-white text-graphite",
  doing: "border-orange/50 bg-tint text-rust",
  blocked: "border-bad/40 bg-[#fdeceb] text-bad",
  done: "border-good/30 bg-[#e9f5ef] text-good",
  answered: "border-good/30 bg-[#e9f5ef] text-good",
};

export function ProjectBoard() {
  const { data, setData, error, pause } = useLoad<Project>("/api/project", 30_000);
  const [tab, setTab] = useState<"tasks" | "questions">("tasks");
  const [hideDone, setHideDone] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function call(path: string, method: string, body?: unknown) {
    setProblem(null);
    try {
      setData(await api<Project>(path, { method, body }));
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Couldn't save. Try again.");
    }
  }

  const tasks = data?.tasks ?? [];
  const questions = data?.questions ?? [];

  return (
    <>
      <PageHeader
        title="Project plan"
        lead="Tasks by phase and the questions still open. Edits save as you leave a field and are recorded in the history."
      />
      {(error || problem) && <Notice kind="error">{problem ?? error}</Notice>}
      <p className="mb-6 max-w-[70ch] rounded-md border border-line bg-white px-4 py-3">
        <span className="font-semibold">Key date:</span> MCR picks its consultant the week of December 7, 2026. The
        proposal needs to be with them before then.
      </p>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line">
        <div role="tablist" aria-label="Project sections" className="flex gap-1">
          {(
            [
              ["tasks", `Tasks (${tasks.filter((t) => t.status !== "done").length} open)`],
              ["questions", `Open questions (${questions.filter((q) => q.status === "open").length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px cursor-pointer border-b-2 px-3.5 py-2 ${
                tab === id ? "border-ember font-semibold text-ink" : "border-transparent text-mute hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="h-4 w-4 accent-[#d84315]" />
          Hide finished
        </label>
      </div>

      {!data ? (
        !error && <p className="mt-6 text-mute">Loading the plan…</p>
      ) : tab === "tasks" ? (
        <div className="mt-2">
          {data.options.phases.map((phase) => {
            const all = tasks.filter((t) => t.phase === phase);
            const shown = hideDone ? all.filter((t) => t.status !== "done") : all;
            return (
              <section key={phase} className="mt-8">
                <h2 className="flex items-baseline justify-between gap-4 border-b border-ink pb-1.5 text-lg font-semibold">
                  {phase}
                  <span className="text-sm font-normal text-mute">
                    {all.filter((t) => t.status === "done").length} of {all.length} done
                  </span>
                </h2>
                <ul>
                  {shown.map((t) => (
                    <li key={t.id} className="border-b border-line py-2.5">
                      <div className="grid items-start gap-x-3 gap-y-2 lg:grid-cols-[8.5rem_minmax(0,1fr)_11rem_9.5rem_auto]">
                        <StatusSelect
                          value={t.status}
                          options={data.options.statuses}
                          label={`Status of ${t.title}`}
                          onChange={(status) => call(`/api/project/task/${t.id}`, "PATCH", { status })}
                        />
                        <InlineText
                          key={`title:${t.title}`}
                          value={t.title}
                          label="Task"
                          pause={pause}
                          className={t.status === "done" ? "text-mute line-through" : "font-medium"}
                          onSave={(title) => call(`/api/project/task/${t.id}`, "PATCH", { title })}
                        />
                        <InlineText
                          key={`owner:${t.owner}`}
                          value={t.owner}
                          label={`Owner of ${t.title}`}
                          placeholder="Add an owner"
                          pause={pause}
                          onSave={(owner) => call(`/api/project/task/${t.id}`, "PATCH", { owner })}
                        />
                        <input
                          type="date"
                          aria-label={`Due date of ${t.title}`}
                          value={t.due ?? ""}
                          onChange={(e) => call(`/api/project/task/${t.id}`, "PATCH", { due: e.target.value || null })}
                          className="field py-1 text-sm"
                        />
                        <DeleteButton what="task" onDelete={() => call(`/api/project/task/${t.id}`, "DELETE")} />
                      </div>
                      <div className="mt-1 lg:pl-[9.25rem]">
                        <InlineText
                          key={`notes:${t.notes}`}
                          value={t.notes}
                          label={`Notes on ${t.title}`}
                          placeholder="Add a note"
                          multiline
                          pause={pause}
                          className="text-sm text-graphite"
                          onSave={(notes) => call(`/api/project/task/${t.id}`, "PATCH", { notes })}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <AddRow
                  placeholder={`Add a task to ${phase}`}
                  button="Add task"
                  onAdd={(title) => call("/api/project/task", "POST", { title, phase })}
                />
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-2">
          {data.options.audiences.map((audience) => {
            const all = questions.filter((q) => q.audience === audience);
            const shown = hideDone ? all.filter((q) => q.status !== "answered") : all;
            return (
              <section key={audience} className="mt-8">
                <h2 className="flex items-baseline justify-between gap-4 border-b border-ink pb-1.5 text-lg font-semibold">
                  Questions for {audience}
                  <span className="text-sm font-normal text-mute">
                    {all.filter((q) => q.status === "answered").length} of {all.length} answered
                  </span>
                </h2>
                <ul>
                  {shown.map((q) => (
                    <li key={q.id} className="border-b border-line py-3">
                      <div className="grid items-start gap-x-3 gap-y-2 lg:grid-cols-[8.5rem_minmax(0,1fr)_11rem_auto]">
                        <StatusSelect
                          value={q.status}
                          options={["open", "answered"]}
                          label={`Status of question: ${q.question}`}
                          onChange={(status) => call(`/api/project/question/${q.id}`, "PATCH", { status })}
                        />
                        <div>
                          <InlineText
                            key={`q:${q.question}`}
                            value={q.question}
                            label="Question"
                            multiline
                            pause={pause}
                            className="font-medium"
                            onSave={(question) => call(`/api/project/question/${q.id}`, "PATCH", { question })}
                          />
                          <InlineText
                            key={`a:${q.answer}`}
                            value={q.answer}
                            label={`Answer to: ${q.question}`}
                            placeholder="Add the answer once it's known"
                            multiline
                            pause={pause}
                            className="mt-1 text-sm text-graphite"
                            onSave={(answer) =>
                              call(`/api/project/question/${q.id}`, "PATCH", {
                                answer,
                                ...(answer && q.status === "open" ? { status: "answered" } : {}),
                              })
                            }
                          />
                        </div>
                        <InlineText
                          key={`owner:${q.owner}`}
                          value={q.owner}
                          label={`Who is getting the answer to: ${q.question}`}
                          placeholder="Who's asking?"
                          pause={pause}
                          onSave={(owner) => call(`/api/project/question/${q.id}`, "PATCH", { owner })}
                        />
                        <DeleteButton what="question" onDelete={() => call(`/api/project/question/${q.id}`, "DELETE")} />
                      </div>
                    </li>
                  ))}
                </ul>
                <AddRow
                  placeholder={`Add a question for ${audience}`}
                  button="Add question"
                  onAdd={(question) => call("/api/project/question", "POST", { question, audience })}
                />
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function StatusSelect(props: { value: string; options: string[]; label: string; onChange: (v: string) => void }) {
  return (
    <select
      aria-label={props.label}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className={`w-full cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold lg:w-auto ${STATUS_STYLE[props.value] ?? ""}`}
    >
      {props.options.map((o) => (
        <option key={o} value={o}>
          {STATUS_LABEL[o] ?? o}
        </option>
      ))}
    </select>
  );
}

/** Text that looks like text until you click it; saves when you leave it. */
function InlineText(props: {
  value: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  pause: (on: boolean) => void;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(props.value);
  const shared = {
    "aria-label": props.label,
    value: draft,
    placeholder: props.placeholder,
    onFocus: () => props.pause(true),
    onBlur: () => {
      props.pause(false);
      const next = draft.trim();
      if (next !== props.value) props.onSave(next);
      else setDraft(props.value);
    },
    className: `w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 placeholder:text-mute/80 hover:border-line focus:border-line focus:bg-white ${props.className ?? ""}`,
  };
  if (props.multiline) {
    return (
      <textarea
        {...shared}
        rows={Math.max(1, Math.min(draft.split("\n").length + Math.floor(draft.length / 110), 10))}
        onChange={(e) => setDraft(e.target.value)}
        style={{ resize: "none" }}
      />
    );
  }
  return (
    <input
      {...shared}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

function DeleteButton({ what, onDelete }: { what: string; onDelete: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button onClick={() => setAsking(true)} className="cursor-pointer justify-self-start px-1.5 py-1 text-sm text-mute hover:text-bad lg:justify-self-end">
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      <span>Delete this {what}?</span>
      <button onClick={onDelete} className="cursor-pointer font-semibold text-bad underline underline-offset-2">
        Delete
      </button>
      <button onClick={() => setAsking(false)} className="link">
        Keep
      </button>
    </span>
  );
}

function AddRow({ placeholder, button, onAdd }: { placeholder: string; button: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="mt-3 flex max-w-2xl gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text.trim());
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="field py-1.5 text-sm" />
      <button type="submit" disabled={!text.trim()} className="btn btn-quiet btn-small shrink-0">
        {button}
      </button>
    </form>
  );
}
