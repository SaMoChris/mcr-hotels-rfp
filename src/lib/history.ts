import "server-only";
import { query } from "./db";
import { DOCS, saveSection } from "./docs";
import { day, formatValue } from "./format";
import type { Member } from "./http";
import { INPUTS, setModelValue } from "./model/store";
import { KINDS, restoreItem, updateItem } from "./project";

type Row = {
  id: number;
  area: string;
  entity: string;
  label: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: Date;
  user_name: string | null;
  user_id: number;
};

export type Change = { field: string; from: string | null; to: string | null; long?: boolean };

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

const AREA_NAMES: Record<string, string> = {
  model: "Pricing model",
  doc: "Documents",
  task: "Tasks",
  question: "Questions",
  profile: "People",
};

const FIELD_NAMES: Record<string, string> = {
  title: "Title",
  phase: "Phase",
  owner: "Owner",
  status: "Status",
  due: "Due",
  notes: "Notes",
  question: "Question",
  audience: "For",
  answer: "Answer",
};

const STATUS_NAMES: Record<string, string> = {
  todo: "To do",
  doing: "In progress",
  blocked: "Blocked",
  done: "Done",
  open: "Open",
  answered: "Answered",
};

function parse(text: string | null): Record<string, string | null> {
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

const show = (field: string, v: string | null | undefined) =>
  v === null || v === undefined || v === ""
    ? null
    : field === "status"
      ? (STATUS_NAMES[v] ?? v)
      : field === "due"
        ? day(v)
        : String(v);

function describe(r: Row): HistoryItem {
  const base = {
    id: r.id,
    area: r.area,
    action: r.action,
    title: r.label,
    who: r.user_name ?? "Someone",
    at: r.created_at.toISOString(),
  };
  if (r.area === "model") {
    const meta = INPUTS[r.entity];
    const fmt = (v: string | null) => (v === null ? null : meta ? formatValue(Number(v), meta.format) : v);
    return {
      ...base,
      changes: [{ field: "Value", from: fmt(r.old_value), to: fmt(r.new_value) }],
      canRevert: Boolean(meta) && r.old_value !== null,
    };
  }
  if (r.area === "doc") {
    const before = parse(r.old_value);
    const after = parse(r.new_value);
    const changes: Change[] = [];
    if (before.title !== after.title) changes.push({ field: "Title", from: before.title ?? null, to: after.title ?? null });
    if (before.body !== after.body) changes.push({ field: "Text", from: before.body ?? null, to: after.body ?? null, long: true });
    const [doc, key] = r.entity.split(":");
    return { ...base, changes, canRevert: Boolean(DOCS[doc]?.sections.some((s) => s.key === key)) };
  }
  if (r.area === "task" || r.area === "question") {
    const before = parse(r.old_value);
    const after = parse(r.new_value);
    if (r.action === "create" || r.action === "restore") return { ...base, changes: [], canRevert: false };
    if (r.action === "delete") return { ...base, changes: [], canRevert: true };
    const changes = Object.keys(after).map((f) => ({
      field: FIELD_NAMES[f] ?? f,
      from: show(f, before[f]),
      to: show(f, after[f]),
      long: f === "notes" || f === "answer",
    }));
    return { ...base, changes, canRevert: true };
  }
  return {
    ...base,
    changes: r.action === "create" ? [] : [{ field: "Name", from: r.old_value, to: r.new_value }],
    canRevert: false,
  };
}

export async function listHistory(opts: { area?: string; userId?: number; before?: number; limit?: number }) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.area && AREA_NAMES[opts.area]) {
    params.push(opts.area);
    where.push(`h.area = $${params.length}`);
  }
  if (opts.userId) {
    params.push(opts.userId);
    where.push(`h.user_id = $${params.length}`);
  }
  if (opts.before) {
    params.push(opts.before);
    where.push(`h.id < $${params.length}`);
  }
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  params.push(limit + 1);
  const rows = await query<Row>(
    `SELECT h.id, h.area, h.entity, h.label, h.action, h.old_value, h.new_value, h.created_at, h.user_id,
            u.name AS user_name
       FROM history h JOIN users u ON u.id = h.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY h.id DESC LIMIT $${params.length}`,
    params,
  );
  const people = await query<{ id: number; name: string }>(
    "SELECT id, name FROM users WHERE name IS NOT NULL ORDER BY name",
  );
  return {
    items: rows.slice(0, limit).map(describe),
    more: rows.length > limit,
    people,
    areas: AREA_NAMES,
  };
}

export class RevertError extends Error {}

/** Puts back what one history entry changed. The undo is itself recorded. */
export async function revert(user: Member, id: number): Promise<void> {
  const rows = await query<Row>(
    "SELECT h.*, NULL AS user_name FROM history h WHERE h.id = $1",
    [id],
  );
  const r = rows[0];
  if (!r) throw new RevertError("That history entry no longer exists.");

  if (r.area === "model") {
    if (r.old_value === null) throw new RevertError("There is no earlier value to go back to.");
    await setModelValue(user, r.entity, Number(r.old_value), "revert");
    return;
  }
  if (r.area === "doc") {
    const [doc, key] = r.entity.split(":");
    const before = parse(r.old_value);
    if (typeof before.title !== "string" || typeof before.body !== "string") {
      throw new RevertError("There is no earlier text to go back to.");
    }
    await saveSection(user, doc, key, { title: before.title, body: before.body }, "revert");
    return;
  }
  if (r.area === "task" || r.area === "question") {
    const kind = KINDS[r.area];
    if (!kind) throw new RevertError("This entry can't be undone.");
    if (r.action === "delete") {
      await restoreItem(user, r.area, parse(r.old_value));
      return;
    }
    if (r.action === "update" || r.action === "revert") {
      await updateItem(user, r.area, Number(r.entity.split(":")[1]), parse(r.old_value), "revert");
      return;
    }
  }
  throw new RevertError("This entry can't be undone.");
}
