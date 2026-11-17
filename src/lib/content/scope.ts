import "server-only";
import { PRICING_REQUIREMENTS, REQUIREMENT_GROUPS, scopeTable } from "./requirements";

export type Section = { key: string; title: string; body: string };

const techBody = [
  "\"Must\" items are pass/fail for the hotel groups a bidder bids on; \"Should\" items are scored.",
  ...REQUIREMENT_GROUPS.map((g) => `### ${g.title}\n\n${g.lead}\n\n${scopeTable(g.items)}`),
].join("\n\n");

export const SCOPE_SECTIONS: Section[] = [
  {
    key: "purpose",
    title: "Purpose and MCR snapshot",
    body: `MCR wants one processor for its hotels, chosen by RFP, covering on-property payments and online bookings. This page sets the scope Verisave proposes and the technology requirements the RFP will hold bidders to. Internal draft; not yet for MCR.

| Item | Detail |
| --- | --- |
| Position | 3rd-largest U.S. hotel owner-operator (MCR's own claim) |
| Portfolio | 150 hotels, 25,000+ rooms, 37 states, 107 cities |
| Flags | Mostly Marriott and Hilton flags (9 Marriott and 8 Hilton brands in 2022 press materials), plus unflagged independents |
| Independents | TWA Hotel, The High Line Hotel, Pasadena Hotel & Pool |
| International | The Kensington Collection, London: four assets bought April 2026 for £150M, under renovation |
| Operating model | Owns and self-manages; flagged hotels run under franchise agreements |
| Offices | New York, London, Dallas, Chicago, Richmond VA |

From the call: about 140 hotels in planning scope and close to $1B in annual card volume, both client-reported and to be reconciled to statements. The real footprint is the MID count across rooms, restaurants, bars and other outlets, likely several hundred.`,
  },
  {
    key: "constraints",
    title: "Scope options and brand constraints",
    body: `The brands, not MCR, choose the processor at most of MCR's hotels, so the first decision is which hotels the RFP can actually award.

| Segment | Who picks the processor | What we know | RFP implication |
| --- | --- | --- | --- |
| Marriott-flagged | Marriott, by brand standard | Marriott named Chase Paymentech acquirer for all U.S. and Canada hotels in 2015. FreedomPay became the brand-standard gateway in Q1 2020, with Chase kept as processor. Sertifi is the brand standard for third-party authorizations. | Acquirer likely fixed. Still in scope for pricing, data quality and fee review. Confirm the 2026 standard. |
| Hilton-flagged | Hilton's approved-supplier list | Elavon lists itself as an approved supplier for Hilton. The full list isn't public. | Only Hilton-approved suppliers can bid. MCR's franchise team pulls the list. |
| U.S. independents | MCR | TWA Hotel, The High Line Hotel, Pasadena Hotel & Pool: full-service, F&B, events, own booking engines. Current stack per the call: FreedomPay, Fiserv, Stayntouch, Paymentech, possibly Shift4 or Shiji. | Fully open. The hardest omni-channel requirements live here. |
| London | MCR | Standalone Kensington Collection brand; GBP, UK card rules | Open. The winner must acquire in the UK. |

Three ways to scope it:

1. **All hotels on one acquirer.** Works only if one bidder is approved by both Marriott and Hilton and covers the UK. The field shrinks to one or two names; Chase is the obvious test.
2. **Every hotel where MCR has the choice** (Hilton, independents, London). Marriott hotels stay on Chase and FreedomPay. Proposed working assumption until the brand standards are in hand.
3. **Independents and London only.** Smallest volume, most complex requirements.

The engagement supports three outcomes: renegotiate incumbent agreements, competitively source the hotels and channels that can switch, and identify longer-term technology changes that open up savings later. Gate 2 is a real go/no-go: a narrow RFP, or none, can be the right answer if brand limits leave little to bid. Material overcharges found in the baseline are raised with the incumbent as found; MCR's contact sees that as a bonus, not the purpose.`,
  },
  {
    key: "phases",
    title: "Phases, gates and timeline",
    body: `About 26 weeks from kickoff to the final recommendation, in five phases that each end at a gate MCR signs off. Phase 0 is sold on its own, and its readiness report re-prices Phases 1–4. Fees and hours are on the Pricing model page.

- **Phase 0, Readiness (weeks 1–3).** Kickoff, about 10 stakeholder interviews, hotel, legal entity and MID inventory, brand payment standards for rooms, restaurants and bars, contract review, data-format assessment. **Gate 1:** inventory and data-quality assessment complete; Phases 1–4 re-estimated.
- **Phase 1, Baseline and systems discovery (weeks 3–11).** Twelve months of statements turned into an analysis database with AI extraction, plus transaction-level exports. Fee audit by MID including Amex, controllable vs noncontrollable fees, a hotel ranking by volume, cost, opportunity and switching feasibility, and an opportunity register. In parallel: a systems survey of every hotel, grouping into 12–18 technology archetypes, one workshop per archetype, and payment-flow diagrams. **Gate 2:** MCR approves the baseline, eligible scope and requirements, and decides whether a broad RFP is warranted.
- **Phase 2, RFP strategy and development (weeks 11–15).** Sourcing model (one provider or a limited preferred-provider group), a short RFI if brand eligibility is still unclear, requirements traceability matrix, RFP package, pricing template and three-year cost model. **Gate 3:** RFP released.
- **Phase 3, Bidders, evaluation and negotiation (weeks 15–25).** Q&A, every bid replayed against MCR's 12-month mix, integration and brand claims validated, demos and references, best-and-final offers, negotiation. **Gate 4:** MCR approves preferred supplier(s).
- **Phase 4, Recommendation and handoff (weeks 25–26).** Executive readout, high-level transition roadmap, final-offer record. **Gate 5:** closeout.
- **After the award:** implementation and monitoring are separate engagements.`,
  },
  {
    key: "data-request",
    title: "Data request to MCR",
    body: `The baseline and the requirements both depend on these, so they go to MCR at kickoff.

| Item | Detail | Owner at MCR |
| --- | --- | --- |
| Processor statements | 12 months for every MID, including restaurants, bars and other outlets | Finance / treasury |
| Transaction-level exports | 12 months of processor transaction and fee exports, with interchange detail where available | Finance / treasury |
| Amex statements | Same months, every Amex SE number | Finance / treasury |
| Current contracts | Processor and gateway agreements: pricing, term and end dates, auto-renewal, termination fees, exclusivity, minimums | Finance / legal |
| Gateway invoices and MID register | Every gateway bill, and the master list of MIDs by hotel and outlet | Finance / treasury |
| Hotel list | Hotel, flag, rooms, legal entity, MIDs, outlets (F&B, spa, retail, parking) | Asset management |
| Outlet operators | Which restaurants, bars and spas are run by third parties, and who holds their merchant accounts | Asset management / F&B |
| Systems inventory | Per hotel: PMS and version (cloud or on-premise), POS per outlet, booking engine/CRS, channel manager, gateway, terminal models, accounting/ERP | IT |
| Brand payment standards | Current Marriott and Hilton payment requirements, including restaurants and bars, and approved suppliers | Franchise relations |
| Channel mix | Share of bookings by brand.com, own booking engine, OTA hotel-collect, OTA-collect (virtual card), GDS/corporate, groups and events | Revenue management |
| Disputes | 12 months of chargebacks by hotel and reason | Finance |
| PCI | Current PCI validation type by hotel, P2PE in use or not | IT / security |
| London | Current acquirer, GBP volumes, booking engine | London platform team |`,
  },
  { key: "technology", title: "Technology requirements", body: techBody },
  {
    key: "pricing-requirements",
    title: "Commercial and pricing requirements",
    body: `Every bidder prices on Verisave's template, pre-filled with MCR's transaction mix, so bids compare like for like.\n\n${scopeTable(PRICING_REQUIREMENTS)}`,
  },
  {
    key: "evaluation",
    title: "Evaluation and candidate bidders",
    body: `MCR's priority is operational simplification, so total cost carries 10% of the score. Brand approval, mandatory integrations and PCI are pass/fail gates, not scores. Every bid is still replayed against MCR's 12-month mix for a three-year cost. MCR approves the weights at Gate 3.

| Criterion | Weight |
| --- | --- |
| Operational fit, reporting and reconciliation | 30% |
| Brand and technical coverage | 25% |
| Implementation feasibility and continuity | 20% |
| Support, governance, security and portability | 15% |
| Total cost and commercial terms | 10% |

Candidates to invite once the scope is set. Every row needs the brand approval and certification check before it goes on the list.

| Bidder | Why invite | Check first |
| --- | --- | --- |
| J.P. Morgan Payments (Chase) | [Marriott's named acquirer](https://ofhub.marriott.com/2015/02/marriotts-transition-to-new-credit-card-processor-begins-april-1/) for U.S. and Canada hotels; the only route to one acquirer across all hotels | Hilton approval; UK acquiring |
| Elavon (U.S. Bank) | [Lists itself](https://elavon.com/industries/travel-and-hospitality/hotels-lodging/property-management.html) as an approved supplier for Hilton, Marriott/Starwood, IHG, Choice, Wyndham and Best Western | Current Marriott U.S. status; UK coverage |
| FreedomPay | [Marriott's brand-standard gateway](https://ofhub.marriott.com/2019/11/guidance-regarding-merchantlink-shift4-migration-requirement/) | A gateway, not an acquirer: bids with an acquirer partner |
| Adyen | One platform for U.S. and UK acquiring | Hilton approval; OnQ and OPERA Cloud certification |
| Shift4 | Large hospitality gateway footprint | Acquirer of record; brand approvals |
| Fiserv, Worldpay, Global Payments | Large hospitality acquirers | Brand approvals; PMS certifications |`,
  },
  {
    key: "terms",
    title: "Baseline and engagement terms",
    body: `Verisave is paid a consulting fee by phase, not a share of savings (see the Proposal page). The baseline is still signed at Gate 2 so results can be measured.

- **Baseline:** 12 months per MID from the statement database, adjusted for card mix, excluding MCR's own in-flight projects, acquisitions and brand-driven changes. Signed at Gate 2.
- **Overcharges:** material overcharges or quick optimizations found in the baseline are raised with the incumbent as found, without a separate workstream.
- **Brand-locked hotels:** stay in the baseline and requirements. A formal renegotiation track with incumbents is a priced option.
- **Independence:** Verisave takes no fee, referral or residual from any bidder, and discloses any bidder relationship before invitations go out.`,
  },
  {
    key: "sources",
    title: "Sources",
    body: `- [MCR Hotels](https://www.mcrhotels.com/): portfolio size, offices
- [Hospitality Net, MCR press release, June 2022](https://www.hospitalitynet.org/news/4110853/mcr-concludes-a-record-breaking-24-months-with-2-billion-of-real-estate-investments): Marriott and Hilton brand counts
- [Serviced Apartment News, The Kensington Collection](https://servicedapartmentnews.com/?p=41217): London platform
- [Marriott franchise update, Feb 2015](https://ofhub.marriott.com/2015/02/marriotts-transition-to-new-credit-card-processor-begins-april-1/): Chase Paymentech as acquirer
- [Marriott franchise update, Nov 2019](https://ofhub.marriott.com/2019/11/guidance-regarding-merchantlink-shift4-migration-requirement/): FreedomPay gateway standard
- [Marriott franchise update, Sep 2019](https://ofhub.marriott.com/2019/09/sertifi-eauthorize-now-a-brand-standard): Sertifi brand standard
- [Elavon, hotel property management](https://elavon.com/industries/travel-and-hospitality/hotels-lodging/property-management.html): brand approvals`,
  },
];
