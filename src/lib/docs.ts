import "server-only";
import { RFP_SECTIONS } from "./content/rfp";
import { SCOPE_SECTIONS, type Section } from "./content/scope";
import { query, tx } from "./db";
import { logHistory, type HistoryEntry, type Member } from "./http";

// Editable documents. The starting text lives in code; a section someone has
// edited is stored in the database and shown in place of the starting text.

export const DOCS: Record<string, { title: string; description: string; sections: Section[] }> = {
  scope: {
    title: "Scope and requirements",
    description: "What the RFP covers, the brand constraints, and the requirements bidders are held to.",
    sections: SCOPE_SECTIONS,
  },
  rfp: {
    title: "Draft RFP",
    description: "Working draft of the document MCR issues to payment providers.",
    sections: RFP_SECTIONS,
  },
};

export type DocSection = Section & { edited: boolean; by: string | null; at: string | null };

export async function loadDoc(doc: string): Promise<DocSection[] | null> {
  const def = DOCS[doc];
  if (!def) return null;
  const rows = await query<{ key: string; title: string; body: string; name: string | null; updated_at: Date }>(
    `SELECT d.key, d.title, d.body, u.name, d.updated_at
       FROM doc_sections d LEFT JOIN users u ON u.id = d.updated_by WHERE d.doc = $1`,
    [doc],
  );
  const saved = new Map(rows.map((r) => [r.key, r]));
  return def.sections.map((s) => {
    const r = saved.get(s.key);
    return r
      ? { key: s.key, title: r.title, body: r.body, edited: true, by: r.name, at: r.updated_at.toISOString() }
      : { ...s, edited: false, by: null, at: null };
  });
}

export class DocError extends Error {}

/** Saves one section. `next: null` restores the starting text. */
export async function saveSection(
  user: Member,
  doc: string,
  key: string,
  next: { title: string; body: string } | null,
  action: HistoryEntry["action"] = "update",
): Promise<void> {
  const def = DOCS[doc];
  const base = def?.sections.find((s) => s.key === key);
  if (!def || !base) throw new DocError("That section doesn't exist.");
  const target = next ?? { title: base.title, body: base.body };
  const title = target.title.trim();
  const body = target.body.replace(/\r\n/g, "\n").trim();
  if (!title || title.length > 200) throw new DocError("Give the section a title of up to 200 characters.");
  if (body.length > 60_000) throw new DocError("This section is too long to save. Split it or trim it.");

  await tx(async (q) => {
    await q("SELECT pg_advisory_xact_lock(hashtext($1))", [`doc:${doc}:${key}`]);
    const cur = await q<{ title: string; body: string }>(
      "SELECT title, body FROM doc_sections WHERE doc = $1 AND key = $2",
      [doc, key],
    );
    const old = cur[0] ?? { title: base.title, body: base.body };
    if (old.title === title && old.body === body) return;
    if (title === base.title && body === base.body) {
      await q("DELETE FROM doc_sections WHERE doc = $1 AND key = $2", [doc, key]);
    } else {
      await q(
        `INSERT INTO doc_sections (doc, key, title, body, updated_by, updated_at) VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (doc, key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body,
           updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [doc, key, title, body, user.id],
      );
    }
    await logHistory(q, {
      userId: user.id,
      area: "doc",
      entity: `${doc}:${key}`,
      label: `${def.title}: ${title}`,
      action: next === null && action === "update" ? "reset" : action,
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify({ title, body }),
    });
  });
}
