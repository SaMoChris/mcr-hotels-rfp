import "server-only";
import { PRICING_REQUIREMENTS, REQUIREMENT_GROUPS, rfpTable } from "./requirements";
import type { Section } from "./scope";

// First draft of the bidder-facing RFP. Square brackets mark facts that come
// out of Phases 0-2 (inventory, baseline, MCR approvals) and are not known yet.

const requirementSections: Section[] = REQUIREMENT_GROUPS.map((g, i) => ({
  key: `req-${g.key}`,
  title: `6.${i + 1} ${g.title}`,
  body: `${rfpTable(g.items)}`,
}));

export const RFP_SECTIONS: Section[] = [
  {
    key: "notice",
    title: "About this draft",
    body: `This is a working draft of the RFP that MCR will issue to payment providers, administered by Verisave. It is not approved for release. Text in [square brackets] is a placeholder for a fact that comes from the inventory, the baseline or an MCR decision. MCR approves the final package at Gate 3.`,
  },
  {
    key: "introduction",
    title: "1. Introduction and purpose",
    body: `MCR ("MCR") invites proposals for payment processing, gateway and related services across the hotels listed in Attachment A. Verisave, LLC administers this RFP on MCR's behalf and is the single point of contact for bidders.

MCR's goals, in priority order:

1. **Simplify operations.** Fewer providers, one way of working across hotels, and clear accountability for support.
2. **Reconcile and report centrally.** Every transaction and every fee visible by hotel, legal entity and outlet, matched to the folio.
3. **One card on file from booking to checkout.** A card captured online works at the front desk and every outlet without re-entry.
4. **Scale with the portfolio.** Hotels are bought and sold often; adding or removing one must be fast and cheap.
5. **Pay a fair, transparent price.** Interchange-plus pricing with every fee on one schedule.

MCR prefers a single provider where that is practical. Bidders may propose for all hotel groups or for named groups only; MCR may award to one provider or to a limited group of preferred providers.`,
  },
  {
    key: "background",
    title: "2. About MCR and the hotels in scope",
    body: `MCR is one of the largest hotel owner-operators in the United States. It owns and manages approximately [140] hotels in scope for this RFP, across [37] states, operating under Marriott and Hilton brands and as independent hotels.

| Hotel group | Hotels | MIDs | Annual card volume | PMS | POS | Current processor / gateway |
| --- | --- | --- | --- | --- | --- | --- |
| Hilton-branded | [n] | [n] | [$] | [Hilton brand PMS] | [list] | [list] |
| Marriott-branded | [n] | [n] | [$] | [OPERA Cloud / brand PMS] | [list] | [list] |
| Independent, U.S. | [n] | [n] | [$] | [Stayntouch / other] | [list] | [list] |
| London (if in scope) | [n] | [n] | [£] | [list] | [list] | [list] |

Total annual card volume is approximately [$1 billion], to be confirmed in the data pack. Hotels operate as separate legal entities, each with its own merchant accounts. Food and beverage, spa, parking, retail and event outlets are in scope where MCR controls the merchant account.

**Brand requirements.** Branded hotels must use payment providers and solutions that the brand approves. Bidders must state, for each brand, whether they are an approved provider today and attach evidence. [Marriott-branded hotels are / are not in scope for a change of acquirer or gateway. To be set at Gate 2.]`,
  },
  {
    key: "scope-of-services",
    title: "3. Services requested",
    body: `Bidders may propose any or all of the following. State clearly which you provide directly and which through a partner.

- Merchant acquiring and processing for Visa, Mastercard, American Express, Discover and debit networks
- Payment gateway and token vault, integrated with the property management, point-of-sale and booking systems in Attachment B
- Card-present terminals with point-to-point encryption, including deployment and replacement
- Online payments for MCR's own booking engines, payment links and call-center bookings
- Handling of OTA virtual cards and commercial cards, including enhanced transaction data
- Reporting, reconciliation files and a portal with a portfolio hierarchy
- Chargeback and dispute management tools
- Implementation, migration of stored cards, training and ongoing support
- [UK acquiring for the London hotels, if in scope]`,
  },
  {
    key: "timetable",
    title: "4. Process and timetable",
    body: `| Step | Date |
| --- | --- |
| RFP issued | [date] |
| Intent to bid and signed NDA due | [date, about 1 week after issue] |
| Data pack released to bidders under NDA | [date] |
| Bidder questions due | [date, about 2 weeks after issue] |
| Answers issued to all bidders | [date] |
| Proposals due | [date, about 4 weeks after issue] |
| Clarifications and shortlist | [dates] |
| Finalist demonstrations and reference calls | [dates] |
| Best and final offers | [date] |
| Preferred provider(s) selected | [date] |
| Contract negotiation and signature | [dates] |
| Pilot hotels live | [target] |

MCR may change this timetable and will tell all bidders at the same time.`,
  },
  {
    key: "instructions",
    title: "5. Instructions to bidders",
    body: `- **One point of contact.** Send all questions and submissions to Verisave at [RFP mailbox]. Do not contact MCR staff, hotel teams or brand representatives about this RFP. Doing so may lead to disqualification.
- **Questions.** Submit questions in writing by the date in section 4. Answers go to every bidder, without naming who asked.
- **Format.** Submit (a) this document's requirement tables with your responses, (b) the pricing template in Attachment C, unmodified, (c) the coverage matrix in Attachment D, (d) the implementation and security questionnaires in Attachments E and F, and (e) a cover letter of no more than three pages.
- **Answering requirements.** For each requirement, answer Comply, Partial or No. For Comply and Partial, give evidence: a live customer, a certification, or a document. A roadmap item is not compliance; give its delivery date and answer Partial.
- **Mandatory requirements.** Requirements marked Mandatory are pass/fail for the hotel groups you bid on. A "No" on a mandatory requirement removes the proposal from that hotel group. Price cannot offset it.
- **Hotel groups.** State which hotel groups you bid on. You may bid on all or some.
- **Partners.** Name every partner or subcontractor (acquirer, gateway, terminal supplier), what each does, and who MCR contracts with.
- **Validity.** Proposals and pricing stay valid for [180] days from the due date.
- **Confidentiality.** The data pack and all MCR information are confidential under the NDA. MCR and Verisave keep proposals confidential and use them only for this evaluation.
- **Independence.** Verisave is paid by MCR alone and accepts no fee, commission or residual from any bidder. Do not offer one.`,
  },
  {
    key: "eligibility",
    title: "6. Requirements",
    body: `Requirements are grouped by area in sections 6.1 to 6.${REQUIREMENT_GROUPS.length}. Before those, confirm these eligibility gates for every hotel group you bid on:

| Gate | Evidence to attach |
| --- | --- |
| Approved by the hotel brand for each branded group bid | Brand approval letter or published supplier listing |
| Certified, in-production integration with each PMS and POS in that group (Attachment B) | Certification letters and live hotel counts, by product and version |
| PCI DSS Level 1 service provider | Current Attestation of Compliance; SOC 1 and SOC 2 Type II reports |
| Able to board each MCR legal entity as a separate merchant | Underwriting requirements and sample boarding timeline |`,
  },
  ...requirementSections,
  {
    key: "commercial",
    title: "7. Commercial response",
    body: `Price on the template in Attachment C. It is pre-filled with MCR's actual 12-month transaction mix by hotel group, card type and channel, so every bid is compared on the same volumes. Do not change its structure. Pricing that is not on the template will not be evaluated.

${rfpTable(PRICING_REQUIREMENTS)}

Also state:

- One-time costs: implementation, certification, stored-card migration, terminals, training
- Any minimums, volume commitments or exclusivity you require
- Pricing for a single-provider award and for an award of only the hotel groups you bid on
- How pricing changes if hotels are added or removed during the term`,
  },
  {
    key: "implementation",
    title: "8. Implementation and transition",
    body: `Describe how you would move the hotels you bid on, including:

- A plan by wave, grouped by PMS and POS type, with a pilot at [one independent and one Hilton hotel] before any wider rollout
- Your team: named roles, how many hotels they have migrated, and what you need from MCR and from each hotel
- Cutover at a hotel: steps, timing, rollback, and how in-house guests and open authorizations are protected
- Migration of stored cards for future reservations from MCR's current providers
- Training for front desk, outlets and accounting
- What stays with the old provider after cutover (open disputes, refunds, funding) and for how long
- How a newly acquired hotel is brought on, and how a sold hotel is removed`,
  },
  {
    key: "service",
    title: "9. Service, support and governance",
    body: `- Support model for hotels (24/7 line, languages, escalation path) and for MCR's corporate finance and IT teams
- Named account management and how often you review performance with MCR
- Service levels you commit to, with credits: authorization uptime, settlement timeliness, support response, terminal replacement
- Incident communication: how and how fast MCR is told about an outage or a security event
- Three references from hotel owner-operators or management companies with 25 or more hotels, at least one running the same PMS as MCR's largest group`,
  },
  {
    key: "contract",
    title: "10. Contract terms MCR requires",
    body: `State whether you accept each term. Exceptions must be listed with your proposal, not raised later.

- A master agreement that every MCR legal entity can join, with one set of terms and pricing
- Term of three years or less; renewals of no more than one year; no automatic renewal without notice
- No early termination fee for a hotel that is sold, reflagged or moved by a brand mandate
- Markup fixed for the term; card-brand changes passed through at cost with 30 days' notice and documentation
- No fee that is not on the agreed schedule
- MCR owns its transaction data and stored cards. At the end of the contract the provider transfers stored cards to a successor at no or a capped cost.
- MCR may audit fees billed against the contract, itself or through an adviser
- Service levels and credits as proposed in section 9
- Termination assistance for at least [90] days`,
  },
  {
    key: "evaluation",
    title: "11. How proposals are evaluated",
    body: `Proposals that pass the eligibility gates and every mandatory requirement are scored on:

| Criterion | Weight |
| --- | --- |
| Operational fit, reporting and reconciliation | [30%] |
| Brand and technical coverage | [25%] |
| Implementation feasibility and continuity | [20%] |
| Support, governance, security and portability | [15%] |
| Total cost and commercial terms | [10%] |

Cost is measured as three-year total cost on MCR's actual transaction mix, including one-time costs. Shortlisted bidders give a scripted demonstration on MCR's own systems and may be asked for a best and final offer.`,
  },
  {
    key: "rfp-terms",
    title: "12. Terms of this RFP",
    body: `- This RFP is not an offer or a commitment to buy. MCR may change or withdraw it, reject any or all proposals, or award to more than one provider.
- Bidders bear their own costs of responding.
- No contract exists until a written agreement is signed by MCR.
- By responding, the bidder confirms that its proposal is accurate and that it has not coordinated its response with another bidder.`,
  },
  {
    key: "attachments",
    title: "Attachments to prepare",
    body: `| Attachment | Contents | Status |
| --- | --- | --- |
| A. Hotel list | Hotel, brand, legal entity, rooms, outlets, MIDs, hotel group | From Phase 0 inventory |
| B. Systems by hotel group | PMS and version, POS per outlet, booking engine, gateway, terminals | From Phase 1 systems survey |
| C. Pricing template | Fee schedule and MCR's 12-month mix by group, card type and channel | From Phase 1 baseline |
| D. Coverage matrix | Hotel group by PMS/POS: bidder marks certified, in progress or not supported | To draft in Phase 2 |
| E. Implementation questionnaire | Team, method, timelines, dependencies | To draft in Phase 2 |
| F. Security questionnaire | PCI, P2PE, data location, incident response, subcontractors | To draft in Phase 2 |
| G. NDA | MCR's form | From MCR legal |`,
  },
];
