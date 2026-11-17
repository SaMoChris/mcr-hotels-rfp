// Pure pricing maths. Mirrors the formulas in the original spreadsheet:
// hours = midpoint of low/high plus contingency; fee = hours x blended rate,
// rounded up to the rounding step; Phases 1-4 carry the bundle discount.

import type { InputMeta, ItemDef, ModelDefs, PhaseId, RoleId, Values } from "./types";

const ROLE_IDS: RoleId[] = ["lead", "pm", "analyst", "exec"];

/** Every editable number in the model, with its default and limits. */
export function buildInputs(defs: ModelDefs): Record<string, InputMeta> {
  const out: Record<string, InputMeta> = {};
  const add = (m: InputMeta) => {
    out[m.key] = m;
  };
  for (const r of defs.roles) {
    add({ key: `rate.${r.id}`, label: `Hourly rate: ${r.name}`, def: r.rate, format: "usd", min: 0, max: 2000 });
  }
  for (const p of defs.phases) {
    for (const r of defs.roles) {
      add({
        key: `mix.${p.id}.${r.id}`,
        label: `Role mix: ${p.name}, ${r.name}`,
        def: p.mix[r.id],
        format: "pct",
        min: 0,
        max: 1,
      });
    }
  }
  for (const d of defs.drivers) {
    add({
      key: `driver.${d.id}`,
      label: d.label,
      def: d.value,
      format: d.format,
      min: 0,
      max: d.format === "flag" ? 1 : 100000,
    });
  }
  for (const u of defs.units) {
    add({ key: `unit.${u.id}.low`, label: `${u.label} (low hours)`, def: u.low, format: "hours", min: 0, max: 1000 });
    add({ key: `unit.${u.id}.high`, label: `${u.label} (high hours)`, def: u.high, format: "hours", min: 0, max: 1000 });
  }
  for (const it of defs.items) {
    if (it.basis.kind === "unit") continue;
    add({ key: `item.${it.id}.low`, label: `${it.label} (low hours)`, def: it.basis.low, format: "hours", min: 0, max: 5000 });
    add({ key: `item.${it.id}.high`, label: `${it.label} (high hours)`, def: it.basis.high, format: "hours", min: 0, max: 5000 });
  }
  for (const c of defs.commercial) {
    add({
      key: `com.${c.id}`,
      label: c.label,
      def: c.value,
      format: c.format,
      min: c.id === "rounding" ? 1 : 0,
      max: c.format === "pct" ? 1 : 1e12,
    });
  }
  for (const m of defs.milestones) {
    add({ key: `pay.${m.id}.share`, label: `Payment share: ${m.label}`, def: m.share, format: "pct", min: 0, max: 1 });
  }
  for (const c of defs.changes) {
    add({ key: `co.${c.id}.hours`, label: `Change order hours: ${c.label}`, def: c.hours, format: "hours", min: 0, max: 5000 });
  }
  return out;
}

export function defaultValues(inputs: Record<string, InputMeta>): Values {
  const v: Values = {};
  for (const k of Object.keys(inputs)) v[k] = inputs[k].def;
  return v;
}

function roundUp(amount: number, step: number): number {
  const s = step > 0 ? step : 1;
  // The small epsilon stops float noise from bumping an exact multiple up a step.
  return Math.ceil(amount / s - 1e-9) * s;
}

export type ItemResult = { id: string; low: number; high: number; mid: number; priced: number };

export type PhaseResult = {
  id: PhaseId;
  blended: number;
  mixTotal: number;
  low: number;
  high: number;
  mid: number;
  priced: number;
  standalone: number;
  quoted: number;
};

export type ModelResult = {
  items: Record<string, ItemResult>;
  phases: Record<PhaseId, PhaseResult>;
  payments: Record<string, number>;
  paymentShareByPhase: Record<PhaseId, number>;
  changes: Record<string, { rate: number; fee: number }>;
  totals: {
    low: number;
    high: number;
    mid: number;
    priced: number;
    standalone: number;
    quoted: number;
    phase0: number;
    phases1to4: number;
    effectiveRate: number;
    bps: number;
  };
};

function itemHours(it: ItemDef, v: Values): { low: number; high: number } {
  const b = it.basis;
  if (b.kind === "unit") {
    const n = v[`driver.${b.driver}`] ?? 0;
    return { low: n * (v[`unit.${b.unit}.low`] ?? 0), high: n * (v[`unit.${b.unit}.high`] ?? 0) };
  }
  const low = v[`item.${it.id}.low`] ?? 0;
  const high = v[`item.${it.id}.high`] ?? 0;
  if (b.kind === "switch") {
    const on = (v[`driver.${b.driver}`] ?? 0) > 0 ? 1 : 0;
    return { low: on * low, high: on * high };
  }
  return { low, high };
}

export function compute(defs: ModelDefs, v: Values): ModelResult {
  const contingency = v["com.contingency"] ?? 0;
  const bundle = v["com.bundle"] ?? 0;
  const credit = v["com.credit"] ?? 0;
  const volume = v["com.volume"] ?? 0;
  const rounding = v["com.rounding"] ?? 1;

  const items: Record<string, ItemResult> = {};
  const phases = {} as Record<PhaseId, PhaseResult>;
  for (const p of defs.phases) {
    let blended = 0;
    let mixTotal = 0;
    for (const r of ROLE_IDS) {
      const share = v[`mix.${p.id}.${r}`] ?? 0;
      mixTotal += share;
      blended += share * (v[`rate.${r}`] ?? 0);
    }
    phases[p.id] = { id: p.id, blended, mixTotal, low: 0, high: 0, mid: 0, priced: 0, standalone: 0, quoted: 0 };
  }

  for (const it of defs.items) {
    const { low, high } = itemHours(it, v);
    const mid = (low + high) / 2;
    const priced = mid * (1 + contingency);
    items[it.id] = { id: it.id, low, high, mid, priced };
    const ph = phases[it.phase];
    ph.low += low;
    ph.high += high;
    ph.mid += mid;
    ph.priced += priced;
  }

  for (const p of defs.phases) {
    const ph = phases[p.id];
    ph.standalone = roundUp(ph.priced * ph.blended, rounding);
  }
  for (const p of defs.phases) {
    const ph = phases[p.id];
    if (p.id === "p0") ph.quoted = ph.standalone;
    else {
      ph.quoted = roundUp(ph.standalone * (1 - bundle), rounding);
      if (p.id === "p1") ph.quoted -= phases.p0.standalone * credit;
    }
  }

  const payments: Record<string, number> = {};
  const paymentShareByPhase = {} as Record<PhaseId, number>;
  for (const p of defs.phases) paymentShareByPhase[p.id] = 0;
  for (const m of defs.milestones) {
    const share = v[`pay.${m.id}.share`] ?? 0;
    payments[m.id] = share * phases[m.phase].quoted;
    paymentShareByPhase[m.phase] += share;
  }

  const changes: Record<string, { rate: number; fee: number }> = {};
  for (const c of defs.changes) {
    const rate = phases[c.phase].blended;
    changes[c.id] = { rate, fee: roundUp((v[`co.${c.id}.hours`] ?? 0) * rate, rounding) };
  }

  const sum = (f: (p: PhaseResult) => number) => defs.phases.reduce((a, p) => a + f(phases[p.id]), 0);
  const quoted = sum((p) => p.quoted);
  const priced = sum((p) => p.priced);
  return {
    items,
    phases,
    payments,
    paymentShareByPhase,
    changes,
    totals: {
      low: sum((p) => p.low),
      high: sum((p) => p.high),
      mid: sum((p) => p.mid),
      priced,
      standalone: sum((p) => p.standalone),
      quoted,
      phase0: phases.p0.quoted,
      phases1to4: quoted - phases.p0.quoted,
      effectiveRate: priced > 0 ? quoted / priced : 0,
      bps: volume > 0 ? (quoted / volume) * 10000 : 0,
    },
  };
}
