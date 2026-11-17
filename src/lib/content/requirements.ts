import "server-only";

// The requirement set, kept in one place so the scope page and the RFP draft
// start from the same list. "Must" items are pass/fail; "Should" are scored.

export type Requirement = { id: string; text: string; priority: "Must" | "Should" };
export type RequirementGroup = { key: string; title: string; lead: string; items: Requirement[] };

const M = "Must" as const;
const S = "Should" as const;

export const REQUIREMENT_GROUPS: RequirementGroup[] = [
  {
    key: "integrations",
    title: "System integrations",
    lead: "Integration fit with MCR's actual systems decides this RFP more than rate, so bidders must prove certified, in-production integrations, not roadmaps. Systems named here are expected and get confirmed in the inventory.",
    items: [
      { id: "INT-01", text: "Certified, in-production integration with each PMS in MCR's inventory: Hilton's brand PMS (OnQ, to confirm), Oracle OPERA Cloud through the Oracle Payment Interface (OPI), and Stayntouch at independent hotels. Give live hotel counts per PMS.", priority: M },
      { id: "INT-02", text: "Certified integration with the POS at every outlet type (for example Oracle Simphony, Agilysys, Toast), including room-charge posting to the guest folio", priority: M },
      { id: "INT-03", text: "Integration with the booking engine/CRS at independent hotels (for example Sabre SynXis), so cards taken online are tokenized by the bidder and usable on property", priority: M },
      { id: "INT-04", text: "Channel manager and OTA connectivity: OTA cards and virtual cards reach the PMS as tokens, with no staff keying", priority: M },
      { id: "INT-05", text: "Group, event and catering systems: deposits and invoices payable by link and posted to the right folio or account", priority: S },
      { id: "INT-06", text: "Accounting/ERP: daily settlement and fee files MCR's accounting system can load, by API or SFTP", priority: M },
      { id: "INT-07", text: "For each integration, state whether it is direct or through a third-party gateway, and who maintains the certification", priority: M },
    ],
  },
  {
    key: "tokens",
    title: "Tokenization and card-on-file",
    lead: "One token per guest card, usable from booking to checkout at every channel, outlet and hotel. This is the core of \"omni-channel\" for a hotel.",
    items: [
      { id: "TOK-01", text: "One token vault across all in-scope hotels, channels and outlets. A card tokenized at booking can be authorized at the front desk and outlets without re-entry.", priority: M },
      { id: "TOK-02", text: "Credential-on-file rules applied correctly: cardholder- vs merchant-initiated flags on no-shows, deposits and delayed charges", priority: M },
      { id: "TOK-03", text: "Inbound migration: bidder imports stored cards from MCR's current providers for future-dated reservations at each cutover, with a plan and stated cost", priority: M },
      { id: "TOK-04", text: "Outbound portability: at contract end the bidder transfers MCR's stored cards to a successor in a PCI-compliant way, at no or capped cost, written into the contract", priority: M },
      { id: "TOK-05", text: "Network tokens (Visa, Mastercard) for stored cards, with automatic updates", priority: S },
      { id: "TOK-06", text: "Account updater for stored cards (Visa Account Updater, Mastercard ABU)", priority: S },
      { id: "TOK-07", text: "Token usable across MIDs and legal entities, for example a guest relocated to a sister hotel", priority: S },
    ],
  },
  {
    key: "lodging",
    title: "Lodging authorization and transaction handling",
    lead: "The processor must handle card-brand lodging rules natively. Getting them wrong costs misuse-of-authorization fees, downgrades and chargebacks.",
    items: [
      { id: "AUTH-01", text: "Estimated authorization at check-in for the stay plus incidentals, with lodging indicators", priority: M },
      { id: "AUTH-02", text: "Incremental authorizations as the folio grows; partial reversals when the final amount is lower", priority: M },
      { id: "AUTH-03", text: "Re-authorization for long stays (extended-stay brands such as Home2 Suites and Residence Inn)", priority: M },
      { id: "AUTH-04", text: "Final capture at checkout, including express and after-departure checkout; delayed charges (minibar, damage) as separate, correctly flagged transactions", priority: M },
      { id: "AUTH-05", text: "No-show and late-cancellation charges under card-brand rules, with the reservation evidence kept", priority: M },
      { id: "AUTH-06", text: "Advance deposits and prepaid rates charged at booking, with refunds linked to the original transaction", priority: M },
      { id: "AUTH-07", text: "Automatic release of unused authorizations, plus a report of authorizations never captured", priority: M },
      { id: "AUTH-08", text: "Tip adjustment, split checks and pay-at-table at restaurant and bar outlets, with tips within card-brand tolerances and no new authorization", priority: M },
      { id: "AUTH-09", text: "Merchant choice of network on U.S. dual-network debit, card-present", priority: S },
      { id: "AUTH-10", text: "Offline store-and-forward when connectivity drops, with limits MCR sets", priority: S },
    ],
  },
  {
    key: "hardware",
    title: "Card-present hardware, P2PE and security",
    lead: "Every terminal must be certified with the PMS or POS it sits on, and encrypted so card data never touches hotel systems.",
    items: [
      { id: "HW-01", text: "EMV chip, contactless and mobile wallets (Apple Pay, Google Pay) at front desks and outlets", priority: M },
      { id: "HW-02", text: "PCI-validated point-to-point encryption (P2PE) solution, to reduce PCI scope at each hotel", priority: M },
      { id: "HW-03", text: "Terminal models certified with each PMS and POS integration; purchase or lease price, deployment and replacement SLA stated", priority: M },
      { id: "HW-04", text: "Bidder is a PCI DSS Level 1 service provider under the current PCI DSS version, provides its Attestation of Compliance and SOC 1 / SOC 2 Type II reports, and states which PCI responsibilities stay with MCR", priority: M },
      { id: "HW-05", text: "Handheld acceptance for pool, events, curbside and mobile check-in", priority: S },
      { id: "HW-06", text: "Remote terminal management (updates, key injection, inventory) across all hotels", priority: S },
    ],
  },
  {
    key: "online",
    title: "Online and remote payments",
    lead: "Online bookings at branded hotels come through Marriott.com and Hilton.com; at independents and in London they come through MCR's own booking engines. Either way the card must land in the same vault the property uses.",
    items: [
      { id: "ONL-01", text: "Hosted payment fields for MCR's own booking engines and websites, tokenizing to the same vault as on-property payments", priority: M },
      { id: "ONL-02", text: "3-D Secure 2 on prepaid and deposit transactions; mandatory for UK and EEA cards", priority: M },
      { id: "ONL-03", text: "Pay-by-link for deposits, group and event invoices and third-party authorizations. Marriott hotels use Sertifi as the brand standard for third-party authorizations, so the bidder must work alongside it.", priority: M },
      { id: "ONL-04", text: "OTA virtual cards (Expedia Collect, Booking.com Payments) charged automatically from the PMS or channel manager on the card's activation date, flagged as commercial, with travel data sent", priority: M },
      { id: "ONL-05", text: "Call-center bookings captured into the PMS without card numbers reaching agents' screens", priority: S },
      { id: "ONL-06", text: "Card-not-present fraud screening tuned for hotels, with rules MCR controls", priority: S },
      { id: "ONL-07", text: "Apple Pay and Google Pay on web booking", priority: S },
    ],
  },
  {
    key: "data",
    title: "Transaction data quality and interchange",
    lead: "The data sent with each transaction sets the interchange paid, and it is the largest cost lever whoever wins. At a hotel booking platform Verisave analyzed in 2026, qualifying OTA virtual cards for the best commercial travel rates was about 80% of the savings found.",
    items: [
      { id: "DATA-01", text: "Lodging data on every lodging transaction: folio number, check-in and check-out dates, room rate and the other card-brand lodging fields", priority: M },
      { id: "DATA-02", text: "Level 2/3 and travel data on commercial cards and OTA virtual cards, to qualify for the lowest commercial travel interchange (Mastercard Corporate Travel data rates, Visa purchasing and corporate travel)", priority: M },
      { id: "DATA-03", text: "Support for Visa's Commercial Enhanced Data Program: how and when the bidder enrolls MCR, and what it charges", priority: M },
      { id: "DATA-04", text: "Correct MCC and descriptor per hotel and outlet", priority: M },
      { id: "DATA-05", text: "Monthly report of downgrades by reason and qualification rate by card type, per MID", priority: M },
      { id: "DATA-06", text: "Interchange category on every transaction in reporting (see REP-02)", priority: M },
      { id: "DATA-07", text: "Amex: OptBlue or direct stated, with travel data passed to Amex", priority: S },
    ],
  },
  {
    key: "reporting",
    title: "Reporting, reconciliation and funding",
    lead: "MCR must be able to see every fee on every transaction, by hotel, and reconcile it to the folio.",
    items: [
      { id: "REP-01", text: "Hierarchy: portfolio, segment (Marriott, Hilton, independent, London), hotel and legal entity, outlet, with every MID mapped", priority: M },
      { id: "REP-02", text: "Transaction-level detail: interchange category, card type, every fee, matched to the folio or reservation number", priority: M },
      { id: "REP-03", text: "Daily settlement to each hotel's bank account; files that reconcile to the PMS night audit", priority: M },
      { id: "REP-04", text: "Next-day funding with cutoff and weekend funding stated; gross settlement with fees billed monthly offered", priority: M },
      { id: "REP-05", text: "All data by API and SFTP, including read access for Verisave's monitoring", priority: M },
      { id: "REP-06", text: "Portal with role-based access for hotel, regional and corporate users", priority: M },
      { id: "REP-07", text: "One consolidated monthly statement plus per-MID statements", priority: S },
    ],
  },
  {
    key: "disputes",
    title: "Chargebacks and disputes",
    lead: "Hotel disputes are won with stay evidence, so the dispute tool has to reach what the PMS holds.",
    items: [
      { id: "CB-01", text: "Portal and API showing every dispute, deadline and status across all hotels", priority: M },
      { id: "CB-02", text: "Chargeback and retrieval fees stated; win rate reported by reason code", priority: M },
      { id: "CB-03", text: "Representment with lodging evidence (folio, registration card, accepted policies, check-in record), pulled from the PMS where integrated", priority: S },
      { id: "CB-04", text: "Visa Compelling Evidence 3.0 and pre-dispute tools (Verifi, Ethoca), with costs stated", priority: S },
      { id: "CB-05", text: "MCR or a third party it names can work disputes through the API", priority: S },
    ],
  },
  {
    key: "london",
    title: "London",
    lead: "Applies if the Kensington Collection is in scope. The same vault and reporting as the U.S. is the goal, which few bidders can do.",
    items: [
      { id: "LON-01", text: "UK acquiring with GBP settlement to UK bank accounts", priority: M },
      { id: "LON-02", text: "Strong Customer Authentication through 3-D Secure 2, with exemption management", priority: M },
      { id: "LON-03", text: "UK GDPR compliance; where card and guest data is stored", priority: M },
      { id: "LON-04", text: "Interchange-plus pricing on UK interchange", priority: M },
      { id: "LON-05", text: "Same token vault, portal and reporting as the U.S. hotels", priority: S },
      { id: "LON-06", text: "Dynamic currency conversion as an MCR opt-in, with the revenue share stated", priority: S },
    ],
  },
  {
    key: "operations",
    title: "Availability, support, implementation and exit",
    lead: "MCR buys and sells hotels often, so adding and removing hotels has to be cheap and fast.",
    items: [
      { id: "OPS-01", text: "Authorization uptime SLA stated (target 99.95% or better), with service credits and a status page", priority: M },
      { id: "OPS-02", text: "24/7 hotel support line; named enterprise account manager", priority: M },
      { id: "OPS-03", text: "Implementation plan by wave with a dedicated team; pilot at one independent and one Hilton hotel before rollout", priority: M },
      { id: "OPS-04", text: "Bidder handles PMS/POS configuration, certification and staff training at each hotel, with costs stated", priority: M },
      { id: "OPS-05", text: "Cutover plan per hotel with rollback; no lost authorizations for in-house guests", priority: M },
      { id: "OPS-06", text: "New hotel live within a stated number of days of acquisition", priority: M },
      { id: "OPS-07", text: "Exit: termination assistance, full data export, stored-card transfer (TOK-04), no termination fee for hotels sold, reflagged or moved by a brand mandate", priority: M },
    ],
  },
];

export const PRICING_REQUIREMENTS: Requirement[] = [
  { id: "PRC-01", text: "Interchange-plus only. Interchange and card-brand assessments at cost; markup as % plus per-item, by channel (card-present, card-not-present, OTA virtual card)", priority: M },
  { id: "PRC-02", text: "No share of interchange savings kept by the bidder (\"optimization\" or \"commercial card savings\" fees)", priority: M },
  { id: "PRC-03", text: "Every fee on one schedule: authorization, gateway, tokenization, P2PE per device, PCI program, account updater, network tokens, 3-D Secure, chargebacks, monthly and minimums. A fee not on the schedule can't be charged.", priority: M },
  { id: "PRC-04", text: "No processor fees named to look like card-brand fees; MCR gets audit rights over fees billed and owns its transaction data", priority: M },
  { id: "PRC-05", text: "Markup fixed for the term; only real card-brand changes passed through, with 30 days' notice and documentation", priority: M },
  { id: "PRC-06", text: "Term of 3 years or less; renewals no longer than 1 year; no termination fees for hotels sold, reflagged or moved by a brand mandate", priority: M },
  { id: "PRC-07", text: "Volume tiers priced on the whole portfolio, not per hotel", priority: M },
  { id: "PRC-08", text: "Amex markup at parity with Visa and Mastercard, or a direct Amex option stated", priority: S },
  { id: "PRC-09", text: "Terminal pricing per device, buy or lease, with no lease lock-in", priority: S },
];

const cell = (s: string) => s.replace(/\|/g, "\\|");

/** A requirements table for the internal scope page. */
export function scopeTable(items: Requirement[]): string {
  const rows = items.map((r) => `| ${r.id} | ${cell(r.text)} | ${r.priority} |`);
  return ["| ID | Requirement | Priority |", "| --- | --- | --- |", ...rows].join("\n");
}

/** A requirements table for bidders, with a column for their answer. */
export function rfpTable(items: Requirement[]): string {
  const rows = items.map((r) => `| ${r.id} | ${cell(r.text)} | ${r.priority === "Must" ? "Mandatory" : "Scored"} | |`);
  return [
    "| ID | Requirement | Type | Bidder response (Comply / Partial / No, with evidence) |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}
