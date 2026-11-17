import "server-only";
import { QUESTION_AUDIENCES, TASK_PHASES, TASK_STATUSES } from "./content/project-seed";
import { query, tx, type Q } from "./db";
import { logHistory, type HistoryEntry, type Member } from "./http";

// Tasks and open questions share one small engine: a table, a list of
// editable fields with rules, and a history entry for every change.

type FieldRule =
  | { type: "text"; min: number; max: number }
  | { type: "enum"; options: readonly string[] }
  | { type: "date" };

type Kind = {
  table: "tasks" | "questions";
  area: "task" | "question";
  titleField: string;
  select: string;
  fields: Record<string, FieldRule>;
  required: string[];
};

export const KINDS: Record<string, Kind> = {
  task: {
    table: "tasks",
    area: "task",
    titleField: "title",
    select: "id, title, phase, owner, status, due::text AS due, notes, position",
    fields: {
      title: { type: "text", min: 1, max: 300 },
      phase: { type: "enum", options: TASK_PHASES },
      owner: { type: "text", min: 0, max: 80 },
      status: { type: "enum", options: TASK_STATUSES },
      due: { type: "date" },
      notes: { type: "text", min: 0, max: 4000 },
    },
    required: ["title", "phase"],
  },
  question: {
    table: "questions",
    area: "question",
    titleField: "question",
    select: "id, question, audience, owner, status, answer, position",
    fields: {
      question: { type: "text", min: 1, max: 600 },
      audience: { type: "enum", options: QUESTION_AUDIENCES },
      owner: { type: "text", min: 0, max: 80 },
      status: { type: "enum", options: ["open", "answered"] },
      answer: { type: "text", min: 0, max: 4000 },
    },
    required: ["question", "audience"],
  },
};

export class ProjectError extends Error {}

type Fields = Record<string, string | null>;

function clean(kind: Kind, input: Record<string, unknown>): Fields {
  const out: Fields = {};
  for (const [name, rule] of Object.entries(kind.fields)) {
    if (!(name in input)) continue;
    const raw = input[name];
    if (rule.type === "date") {
      if (raw === null || raw === "") out[name] = null;
      else if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw))) out[name] = raw;
      else throw new ProjectError("Enter the date as YYYY-MM-DD.");
      continue;
    }
    if (typeof raw !== "string") throw new ProjectError(`"${name}" must be text.`);
    const text = raw.trim();
    if (rule.type === "enum") {
      if (!rule.options.includes(text)) throw new ProjectError(`"${text}" isn't an option for ${name}.`);
    } else if (text.length < rule.min || text.length > rule.max) {
      throw new ProjectError(
        rule.min > 0 && text.length === 0 ? `Enter a ${name}.` : `Keep ${name} under ${rule.max} characters.`,
      );
    }
    out[name] = text;
  }
  return out;
}

const withEditor = (kind: Kind) =>
  `SELECT ${kind.select
    .split(", ")
    .map((c) => `t.${c}`)
    .join(", ")}, t.updated_at, u.name AS updated_by_name
     FROM ${kind.table} t LEFT JOIN users u ON u.id = t.updated_by`;

export async function loadProject() {
  const [tasks, questions] = await Promise.all([
    query(`${withEditor(KINDS.task)} ORDER BY t.position, t.id`),
    query(`${withEditor(KINDS.question)} ORDER BY t.position, t.id`),
  ]);
  return {
    tasks,
    questions,
    options: { phases: TASK_PHASES, statuses: TASK_STATUSES, audiences: QUESTION_AUDIENCES },
  };
}

async function getRow(q: Q, kind: Kind, id: number): Promise<Fields | null> {
  const rows = await q<Fields>(`SELECT ${kind.select} FROM ${kind.table} WHERE id = $1 FOR UPDATE`, [id]);
  return rows[0] ?? null;
}

export async function createItem(user: Member, kindName: string, input: Record<string, unknown>): Promise<void> {
  const kind = KINDS[kindName];
  if (!kind) throw new ProjectError("Unknown item type.");
  const fields = clean(kind, input);
  for (const r of kind.required) if (!fields[r]) throw new ProjectError(`Enter a ${r}.`);
  const cols = Object.keys(fields);
  await tx(async (q) => {
    const pos = await q<{ next: number }>(`SELECT COALESCE(MAX(position), 0) + 1 AS next FROM ${kind.table}`);
    const params = [...cols.map((c) => fields[c]), pos[0].next, user.id];
    const rows = await q<{ id: number }>(
      `INSERT INTO ${kind.table} (${[...cols, "position", "updated_by"].join(", ")})
       VALUES (${params.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
      params,
    );
    await logHistory(q, {
      userId: user.id,
      area: kind.area,
      entity: `${kind.area}:${rows[0].id}`,
      label: String(fields[kind.titleField]),
      action: "create",
      newValue: JSON.stringify(fields),
    });
  });
}

export async function updateItem(
  user: Member,
  kindName: string,
  id: number,
  input: Record<string, unknown>,
  action: HistoryEntry["action"] = "update",
): Promise<void> {
  const kind = KINDS[kindName];
  if (!kind) throw new ProjectError("Unknown item type.");
  const fields = clean(kind, input);
  await tx(async (q) => {
    const row = await getRow(q, kind, id);
    if (!row) throw new ProjectError("That item no longer exists. Someone may have deleted it.");
    const before: Fields = {};
    const after: Fields = {};
    for (const [name, value] of Object.entries(fields)) {
      if ((row[name] ?? null) !== value) {
        before[name] = row[name] ?? null;
        after[name] = value;
      }
    }
    const changed = Object.keys(after);
    if (changed.length === 0) return;
    const params = [...changed.map((c) => after[c]), user.id, id];
    await q(
      `UPDATE ${kind.table} SET ${changed.map((c, i) => `${c} = $${i + 1}`).join(", ")},
         updated_by = $${changed.length + 1}, updated_at = now() WHERE id = $${changed.length + 2}`,
      params,
    );
    await logHistory(q, {
      userId: user.id,
      area: kind.area,
      entity: `${kind.area}:${id}`,
      label: String(after[kind.titleField] ?? row[kind.titleField]),
      action,
      oldValue: JSON.stringify(before),
      newValue: JSON.stringify(after),
    });
  });
}

export async function deleteItem(user: Member, kindName: string, id: number): Promise<void> {
  const kind = KINDS[kindName];
  if (!kind) throw new ProjectError("Unknown item type.");
  await tx(async (q) => {
    const row = await getRow(q, kind, id);
    if (!row) return;
    await q(`DELETE FROM ${kind.table} WHERE id = $1`, [id]);
    await logHistory(q, {
      userId: user.id,
      area: kind.area,
      entity: `${kind.area}:${id}`,
      label: String(row[kind.titleField]),
      action: "delete",
      oldValue: JSON.stringify(row),
    });
  });
}

/** Puts a deleted item back from the copy kept in the history. */
export async function restoreItem(user: Member, kindName: string, saved: Record<string, unknown>): Promise<void> {
  const kind = KINDS[kindName];
  if (!kind) throw new ProjectError("Unknown item type.");
  const fields = clean(kind, saved);
  const cols = Object.keys(fields);
  const position = typeof saved.position === "number" ? saved.position : 0;
  await tx(async (q) => {
    const params = [...cols.map((c) => fields[c]), position, user.id];
    const rows = await q<{ id: number }>(
      `INSERT INTO ${kind.table} (${[...cols, "position", "updated_by"].join(", ")})
       VALUES (${params.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
      params,
    );
    await logHistory(q, {
      userId: user.id,
      area: kind.area,
      entity: `${kind.area}:${rows[0].id}`,
      label: String(fields[kind.titleField]),
      action: "restore",
      newValue: JSON.stringify(fields),
    });
  });
}
