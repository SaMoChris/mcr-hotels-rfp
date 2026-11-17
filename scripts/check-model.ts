// Checks the pricing maths against the figures in the original spreadsheet.
// Run: npm run check:model
import assert from "node:assert/strict";
import { buildInputs, compute, defaultValues } from "../src/lib/model/calc";
import { MODEL_DEFS } from "../src/lib/model/defs";

const inputs = buildInputs(MODEL_DEFS);
const r = compute(MODEL_DEFS, defaultValues(inputs));

const near = (a: number, b: number, label: string) =>
  assert.ok(Math.abs(a - b) < 0.01, `${label}: expected ${b}, got ${a}`);

near(r.phases.p0.quoted, 34500, "Phase 0 fee");
near(r.phases.p1.standalone, 139500, "Phase 1 standalone");
near(r.phases.p1.quoted, 133000, "Phase 1 fee");
near(r.phases.p2.quoted, 57000, "Phase 2 fee");
near(r.phases.p3.quoted, 81500, "Phase 3 fee");
near(r.phases.p4.quoted, 17500, "Phase 4 fee");
near(r.totals.quoted, 323500, "Total fee");
near(r.totals.standalone, 337500, "Total standalone");
near(r.totals.low, 935, "Low hours");
near(r.totals.high, 1459, "High hours");
near(r.totals.priced, 1376.55, "Priced hours");
near(r.totals.bps, 3.235, "Basis points");
near(Object.values(r.payments).reduce((a, b) => a + b, 0), 323500, "Payments total");
near(r.changes.london.fee, 6000, "London change order");
near(r.changes.renegotiation.fee, 11000, "Renegotiation change order");
near(r.changes.manual_extract.fee, 2500, "Manual extraction change order");

console.log(`Model matches the spreadsheet: ${Object.keys(inputs).length} inputs, total $${r.totals.quoted.toLocaleString()}`);
