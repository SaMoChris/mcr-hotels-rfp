// Shared types for the pricing model. Safe to import from client code:
// this file holds no project data.

export type RoleId = "lead" | "pm" | "analyst" | "exec";
export type PhaseId = "p0" | "p1" | "p2" | "p3" | "p4";
export type Format = "usd" | "pct" | "num" | "hours" | "flag";

export type RoleDef = { id: RoleId; name: string; staffedBy: string; rate: number };

export type PhaseDef = {
  id: PhaseId;
  name: string;
  weeks: [number, number];
  gate: string;
  acceptance: string;
  includes: string;
  mix: Record<RoleId, number>;
};

export type DriverDef = {
  id: string;
  label: string;
  note: string;
  value: number;
  format: Format;
  /** Shown for reference only; no formula reads it. */
  referenceOnly?: boolean;
};

export type UnitDef = { id: string; label: string; low: number; high: number };

export type ItemBasis =
  | { kind: "fixed"; low: number; high: number }
  | { kind: "unit"; driver: string; unit: string }
  | { kind: "switch"; driver: string; low: number; high: number };

export type ItemDef = { id: string; phase: PhaseId; label: string; basis: ItemBasis };

export type MilestoneDef = {
  id: string;
  phase: PhaseId;
  label: string;
  share: number;
  week: number;
};

export type ChangeDef = {
  id: string;
  label: string;
  unit: string;
  hours: number;
  phase: PhaseId;
};

export type CommercialDef = { id: string; label: string; note: string; value: number; format: Format };

export type ModelDefs = {
  roles: RoleDef[];
  phases: PhaseDef[];
  drivers: DriverDef[];
  units: UnitDef[];
  items: ItemDef[];
  milestones: MilestoneDef[];
  changes: ChangeDef[];
  commercial: CommercialDef[];
};

/** One editable number. `key` is what gets saved and shown in the history. */
export type InputMeta = {
  key: string;
  label: string;
  def: number;
  format: Format;
  min: number;
  max: number;
};

export type Values = Record<string, number>;

export type OverrideInfo = { by: string; at: string };

export type ModelPayload = {
  defs: ModelDefs;
  inputs: Record<string, InputMeta>;
  values: Values;
  overrides: Record<string, OverrideInfo>;
};
