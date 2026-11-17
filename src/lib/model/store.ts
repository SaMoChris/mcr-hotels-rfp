import "server-only";
import { query, tx } from "../db";
import { logHistory, type HistoryEntry, type Member } from "../http";
import { buildInputs, defaultValues } from "./calc";
import { MODEL_DEFS } from "./defs";
import type { ModelPayload, OverrideInfo } from "./types";

export const INPUTS = buildInputs(MODEL_DEFS);

/** Defaults plus everything the team has saved on top of them. */
export async function loadModel(): Promise<ModelPayload> {
  const rows = await query<{ key: string; value: number; name: string | null; updated_at: Date }>(
    `SELECT m.key, m.value, u.name, m.updated_at
       FROM model_values m LEFT JOIN users u ON u.id = m.updated_by`,
  );
  const values = defaultValues(INPUTS);
  const overrides: Record<string, OverrideInfo> = {};
  for (const r of rows) {
    if (!INPUTS[r.key]) continue;
    values[r.key] = r.value;
    overrides[r.key] = { by: r.name ?? "Someone", at: r.updated_at.toISOString() };
  }
  return { defs: MODEL_DEFS, inputs: INPUTS, values, overrides };
}

export class InputError extends Error {}

/**
 * Saves one input and records who changed it. `value: null` puts the input
 * back to its default. Does nothing when the value is unchanged.
 */
export async function setModelValue(
  user: Member,
  key: string,
  value: number | null,
  action: HistoryEntry["action"] = "update",
): Promise<void> {
  const meta = INPUTS[key];
  if (!meta) throw new InputError("That input doesn't exist in the model.");
  let next = value === null ? meta.def : value;
  if (!Number.isFinite(next)) throw new InputError("Enter a number.");
  if (meta.format === "flag") next = next > 0 ? 1 : 0;
  if (next < meta.min || next > meta.max) {
    throw new InputError(`Enter a value between ${meta.min} and ${meta.max}.`);
  }
  await tx(async (q) => {
    await q("SELECT pg_advisory_xact_lock(hashtext($1))", [`model:${key}`]);
    const cur = await q<{ value: number }>("SELECT value FROM model_values WHERE key = $1", [key]);
    const old = cur[0]?.value ?? meta.def;
    if (old === next) return;
    if (next === meta.def) {
      await q("DELETE FROM model_values WHERE key = $1", [key]);
    } else {
      await q(
        `INSERT INTO model_values (key, value, updated_by, updated_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [key, next, user.id],
      );
    }
    await logHistory(q, {
      userId: user.id,
      area: "model",
      entity: key,
      label: meta.label,
      action: value === null && action === "update" ? "reset" : action,
      oldValue: String(old),
      newValue: String(next),
    });
  });
}
