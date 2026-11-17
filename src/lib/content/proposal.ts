import "server-only";
import { hours, money, whole } from "../format";
import { compute } from "../model/calc";
import type { ModelDefs, Values } from "../model/types";

// The proposal page is written from the live model, so its fees, hours and
// assumptions always match what the team has saved.

const DELIVERABLES: Record<string, string> = {
  p0: "Project charter and workplan, hotel and MID inventory, data intake and quality log, brand-constraint summary, readiness report with re-estimate",
  p1: "12-month baseline model, hotel- and MID-level cost inventory, controllable vs noncontrollable fees, savings opportunity register, hotel ranking, technology inventory, payment-flow diagrams by archetype, current-state report",
  p2: "Sourcing strategy, RFI if needed, requirements traceability matrix, RFP package and response templates, pricing template and three-year cost model, scoring matrix",
  p3: "Q&A log, bid comparison on MCR's 12-month mix, validated integration and brand claims, demo and reference findings, negotiation and final-offer record",
  p4: "Executive recommendation presentation, high-level transition roadmap",
};

const pct = (n: number) => `${+(n * 100).toFixed(1)}%`;

export function buildProposal(defs: ModelDefs, v: Values): string {
  const r = compute(defs, v);
  const t = r.totals;
  const d = (id: string) => v[`driver.${id}`] ?? 0;
  const lastWeek = Math.max(...defs.phases.map((p) => p.weeks[1]));

  const phaseRows = defs.phases
    .map(
      (p) =>
        `| ${p.name} | ${DELIVERABLES[p.id]} | ${p.weeks[0]}–${p.weeks[1]} | ${p.gate}: ${p.acceptance} | ${money(r.phases[p.id].quoted)} |`,
    )
    .join("\n");

  const payments = defs.phases
    .map((p) => {
      const parts = defs.milestones
        .filter((m) => m.phase === p.id)
        .map((m) => `${pct(v[`pay.${m.id}.share`] ?? 0)} at "${m.label}" (${money(r.payments[m.id])})`);
      return `- **${p.name}:** ${parts.join("; ")}.`;
    })
    .join("\n");

  const changes = defs.changes
    .map((c) => `| ${c.label} | ${c.unit} | ${money(r.changes[c.id].fee)} |`)
    .join("\n");

  const rates = defs.roles.map((role) => `${role.name} ${money(v[`rate.${role.id}`] ?? 0)}`).join(", ");
  const credit = v["com.credit"] ?? 0;

  return `Verisave proposes a gated consulting engagement: a paid readiness phase, then four phases that each end at a gate MCR signs off. The estimate for all phases is **${money(t.quoted)}** including ${pct(v["com.contingency"] ?? 0)} contingency: ${money(t.phase0)} for Phase 0 and ${money(t.phases1to4)} for Phases 1–4 bought together. Phase 0 re-prices Phases 1–4 once the MID count, data formats and brand limits are known.

## Positioning

Verisave will establish a defensible, hotel-level cost baseline across MCR's payment operations, document the hotel and restaurant technology requirements, and lead a transparent competitive procurement through supplier recommendation and negotiated terms. The outcome puts operational simplification, reporting, reconciliation and implementability ahead of the lowest advertised rate. Overcharges found along the way are acted on as a bonus.

## Phases, deliverables and fees

| Phase | Deliverables | Weeks | Gate | Fee |
| --- | --- | --- | --- | --- |
${phaseRows}
| **Total** | | ${lastWeek} weeks | | **${money(t.quoted)}** |

The three central assets are the baseline model, the requirements matrix and the commercial comparison model.

## How the fee is built

- About ${whole(t.priced)} priced hours: the midpoint of ${whole(t.low)}–${whole(t.high)} estimated hours plus ${pct(v["com.contingency"] ?? 0)} contingency.
- Hours scale with the scope: hotels, MIDs, statement formats, archetype workshops, bidders, finalists and review rounds.
- Twelve months of statements become a database through AI extraction, so extra months add little time per MID.
- Rate card: ${rates}. The effective rate is about ${money(t.effectiveRate)} an hour.
- Phases 1–4 carry a ${pct(v["com.bundle"] ?? 0)} discount when bought together (${money(t.standalone)} if bought separately).${credit > 0 ? `\n- ${pct(credit)} of the Phase 0 fee is credited against Phase 1.` : ""}
- The total is about ${hours(t.bps)} basis points of MCR's roughly ${money(v["com.volume"] ?? 0)} annual card volume.

## Payment by gate

${payments}

## Assumptions

- Up to ${whole(d("hotels"))} U.S. hotels and ${whole(d("mids"))} MIDs across ${whole(d("formats"))} statement formats, with ${whole(d("months"))} months of statements and transaction exports.
- ${whole(d("interviews"))} stakeholder interviews; ${whole(d("archetypes"))} technology archetypes with one remote workshop each.
- Up to ${whole(d("bidders"))} bidders, ${whole(d("finalists"))} finalists and ${whole(d("review_rounds"))} MCR review rounds${d("rfi") > 0 ? ", with a short RFI if brand eligibility is unclear" : ", with no RFI"}.
- MCR names an executive sponsor, a coordinator, and contacts in finance, treasury, IT, operations, F&B, procurement and legal; supplies data within two weeks of kickoff; and decides within five business days.
- London and site visits are options.

## Change orders

| Change | Unit | Fee |
| --- | --- | --- |
${changes}

Changes to the scope drivers (MIDs, formats, archetypes, bidders) are re-priced at Gate 1 from the model.

## Terms to propose

- **Termination for convenience on 30 days' notice:** MCR pays for gates reached plus work in progress at the rate card, capped at the next milestone payment.
- **Expenses:** pre-approved travel at cost, no markup.
- **Independence:** Verisave takes no fee, referral or residual from any bidder.
- **Not included:** processor implementation, integration development, hardware deployment, token migration, PCI certification work, legal opinions, ongoing monitoring.
- No guarantee of savings, of a single-processor outcome or of an award.
`;
}
