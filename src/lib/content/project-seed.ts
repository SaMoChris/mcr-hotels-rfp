import "server-only";

// Starting tasks and open questions for the project area. Loaded into the
// database once, on first run; after that the team owns them.

export const TASK_PHASES = [
  "Win the work",
  "0 Readiness",
  "1 Baseline and systems",
  "2 RFP strategy and development",
  "3 Bidders, evaluation, negotiation",
  "4 Recommendation and handoff",
] as const;

export const TASK_STATUSES = ["todo", "doing", "blocked", "done"] as const;

export const SEED_TASKS: { phase: (typeof TASK_PHASES)[number]; title: string; owner: string; notes?: string }[] = [
  { phase: "Win the work", title: "Approve the consulting rate card", owner: "", notes: "The model uses placeholder rates: $350 / $300 / $225 / $175." },
  { phase: "Win the work", title: "Confirm internal cost per role and check margin", owner: "" },
  { phase: "Win the work", title: "Confirm analyst capacity for weeks 3–11", owner: "Brandon Ayers" },
  { phase: "Win the work", title: "Reconcile Genia's proposal with the pricing model", owner: "Genia Pruitt", notes: "Hotel count (140 vs 150), timeline (24 vs 26 weeks), phase owners." },
  { phase: "Win the work", title: "Get MID count, processors and data formats from MCR", owner: "Chris Lapierre" },
  { phase: "Win the work", title: "Decide whether to credit Phase 0 against Phase 1", owner: "Chris Lapierre" },
  { phase: "Win the work", title: "Legal review of proposal terms", owner: "", notes: "30-day termination for convenience, liability cap, governing law." },
  { phase: "Win the work", title: "Send the proposal to MCR", owner: "Chris Lapierre", notes: "MCR's consultant selection target is the week of December 7, 2026." },
  { phase: "0 Readiness", title: "Kickoff meeting and data request", owner: "Kent Low" },
  { phase: "0 Readiness", title: "Stakeholder interviews", owner: "Kent Low" },
  { phase: "0 Readiness", title: "Hotel, legal entity and MID inventory", owner: "Brandon Ayers" },
  { phase: "0 Readiness", title: "Collect brand payment standards and processor contracts", owner: "Genia Pruitt" },
  { phase: "0 Readiness", title: "Gate 1: readiness report and re-estimate of Phases 1–4", owner: "Kent Low" },
  { phase: "1 Baseline and systems", title: "Collect 12 months of statements and transaction exports", owner: "Genia Pruitt" },
  { phase: "1 Baseline and systems", title: "Build the statement database with AI extraction", owner: "Brandon Ayers" },
  { phase: "1 Baseline and systems", title: "Fee audit and opportunity register", owner: "Brandon Ayers" },
  { phase: "1 Baseline and systems", title: "Systems survey and archetype workshops", owner: "Kent Low" },
  { phase: "1 Baseline and systems", title: "Gate 2: baseline, eligible scope and requirements approved", owner: "Kent Low" },
  { phase: "2 RFP strategy and development", title: "Sourcing strategy and bidder invite list", owner: "Kent Low" },
  { phase: "2 RFP strategy and development", title: "Finish the RFP package and pricing template", owner: "Kent Low" },
  { phase: "2 RFP strategy and development", title: "Gate 3: RFP released", owner: "Kent Low" },
  { phase: "3 Bidders, evaluation, negotiation", title: "Bidder Q&A and bid normalization", owner: "Kent Low" },
  { phase: "3 Bidders, evaluation, negotiation", title: "Finalist demos and reference checks", owner: "Kent Low" },
  { phase: "3 Bidders, evaluation, negotiation", title: "Gate 4: supplier selection approved", owner: "Kent Low" },
  { phase: "4 Recommendation and handoff", title: "Gate 5: executive readout and transition roadmap", owner: "Genia Pruitt" },
];

export const QUESTION_AUDIENCES = ["MCR", "Verisave"] as const;

export const SEED_QUESTIONS: { audience: (typeof QUESTION_AUDIENCES)[number]; question: string }[] = [
  { audience: "MCR", question: "What result is MCR buying: a savings case, a completed vendor selection, agreements ready to sign, or all three?" },
  { audience: "MCR", question: "Does \"single processor\" mean every hotel, or the hotels where MCR has the choice?" },
  { audience: "MCR", question: "How many MIDs are there across rooms, restaurants, bars and other outlets?" },
  { audience: "MCR", question: "Can each processor supply 12 months of machine-readable statements and transaction exports?" },
  { audience: "MCR", question: "Which hotels are Marriott, Hilton, independent and London today?" },
  { audience: "MCR", question: "What are the current Marriott and Hilton payment standards, including restaurants and bars, and is Chase on Hilton's approved list?" },
  { audience: "MCR", question: "Which restaurants, bars and spas are run by third parties, and who holds their merchant accounts?" },
  { audience: "MCR", question: "Who processes for each segment now, and when do those contracts end?" },
  { audience: "MCR", question: "Which PMS, POS and booking engine runs at each independent hotel?" },
  { audience: "MCR", question: "How much volume is OTA virtual card, corporate and group?" },
  { audience: "MCR", question: "What triggered the RFP: a renewal, Marriott's OPERA Cloud migration, the London launch, or something else?" },
  { audience: "MCR", question: "Who at MCR owns the decision and signs: CFO, treasury, IT?" },
  { audience: "MCR", question: "Is London in scope, and are site visits expected?" },
  { audience: "Verisave", question: "Is there a consulting rate card, or are the placeholder rates approved?" },
  { audience: "Verisave", question: "What does an hour of each role cost us internally?" },
  { audience: "Verisave", question: "Do we offer audit-only as a standalone option, or quote only the full gated engagement?" },
  { audience: "Verisave", question: "Do we offer an optional post-award module on standard gain-share for interchange and data optimization?" },
  { audience: "Verisave", question: "What payment terms and expense cap do we propose?" },
];
