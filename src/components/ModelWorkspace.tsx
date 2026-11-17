"use client";

import { useState } from "react";
import { hours, money, whole } from "@/lib/format";
import type { PhaseId } from "@/lib/model/types";
import { Notice, PageHeader } from "./AppShell";
import { ModelProvider, NumberCell, useModel, useModelLoader } from "./model";

const TABS = ["Fees", "Inputs", "Hours", "Payments", "Change orders"] as const;
type Tab = (typeof TABS)[number];

const pctText = (n: number) => `${+(n * 100).toFixed(1)}%`;

export function ModelWorkspace() {
  const { ctx, error } = useModelLoader();
  const [tab, setTab] = useState<Tab>("Fees");

  return (
    <>
      <PageHeader
        title="Pricing model"
        lead="Tinted cells are inputs. Change one and every fee recalculates for the whole team; each change is saved under your name in the history."
      />
      {error && <Notice kind="error">{error}</Notice>}
      {!ctx ? (
        !error && <p className="text-mute">Loading the model…</p>
      ) : (
        <ModelProvider ctx={ctx}>
          <Headline />
          <div role="tablist" aria-label="Model sections" className="mt-8 flex gap-1 overflow-x-auto border-b border-line">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`-mb-px cursor-pointer border-b-2 px-3.5 py-2 whitespace-nowrap ${
                  tab === t ? "border-ember font-semibold text-ink" : "border-transparent text-mute hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="mt-6 overflow-x-auto">
            {tab === "Fees" && <Fees />}
            {tab === "Inputs" && <Inputs />}
            {tab === "Hours" && <Hours />}
            {tab === "Payments" && <Payments />}
            {tab === "Change orders" && <ChangeOrders />}
          </div>
        </ModelProvider>
      )}
    </>
  );
}

function Headline() {
  const { result } = useModel();
  const t = result.totals;
  const facts = [
    ["Total estimate, all phases", money(t.quoted)],
    ["Phase 0, paid first", money(t.phase0)],
    ["Phases 1–4, bundled", money(t.phases1to4)],
    ["Priced hours", whole(t.priced)],
    ["Effective rate", `${money(t.effectiveRate)}/hr`],
    ["Share of one year's card volume", `${hours(t.bps)} bps`],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-y border-ink py-4 sm:grid-cols-3 xl:grid-cols-6">
      {facts.map(([label, value], i) => (
        <div key={label}>
          <dt className="text-sm text-mute">{label}</dt>
          <dd className={`num mt-0.5 ${i === 0 ? "display text-[1.45rem]" : "text-lg font-semibold"}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Fees() {
  const { model, result } = useModel();
  const t = result.totals;
  return (
    <table className="table min-w-[52rem]">
      <thead>
        <tr>
          <th>Phase</th>
          <th className="r">Fee, quoted</th>
          <th className="r">Fee, standalone</th>
          <th className="r">Priced hours</th>
          <th className="r">Low hours</th>
          <th className="r">High hours</th>
          <th className="r">Blended rate</th>
          <th>Weeks</th>
          <th>Gate and acceptance</th>
        </tr>
      </thead>
      <tbody>
        {model.defs.phases.map((p) => {
          const r = result.phases[p.id];
          return (
            <tr key={p.id}>
              <td className="font-semibold">{p.name}</td>
              <td className="r font-semibold">{money(r.quoted)}</td>
              <td className="r">{money(r.standalone)}</td>
              <td className="r">{hours(r.priced)}</td>
              <td className="r">{hours(r.low)}</td>
              <td className="r">{hours(r.high)}</td>
              <td className="r">{money(r.blended)}</td>
              <td className="whitespace-nowrap">
                {p.weeks[0]}–{p.weeks[1]}
              </td>
              <td className="max-w-[26rem] text-graphite">
                {p.gate}: {p.acceptance}
              </td>
            </tr>
          );
        })}
        <tr className="sum">
          <td>Total</td>
          <td className="r">{money(t.quoted)}</td>
          <td className="r">{money(t.standalone)}</td>
          <td className="r">{hours(t.priced)}</td>
          <td className="r">{hours(t.low)}</td>
          <td className="r">{hours(t.high)}</td>
          <td className="r">{money(t.effectiveRate)}</td>
          <td />
          <td />
        </tr>
      </tbody>
    </table>
  );
}

function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mt-10 mb-2 first:mt-0">
      <h2 className="text-lg font-semibold">{children}</h2>
      {note && <p className="text-sm text-mute">{note}</p>}
    </div>
  );
}

function Inputs() {
  const { model, result } = useModel();
  const d = model.defs;
  return (
    <div className="min-w-[46rem]">
      <SectionTitle>Rate card</SectionTitle>
      <table className="table">
        <thead>
          <tr>
            <th>Role</th>
            <th className="r">Hourly rate</th>
            <th>Staffed by</th>
          </tr>
        </thead>
        <tbody>
          {d.roles.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td className="r">
                <NumberCell k={`rate.${r.id}`} />
              </td>
              <td className="text-graphite">{r.staffedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle note="Share of each phase's hours worked by each role. Each row should add up to 100%.">
        Role mix by phase
      </SectionTitle>
      <table className="table">
        <thead>
          <tr>
            <th>Phase</th>
            {d.roles.map((r) => (
              <th key={r.id} className="r">
                {r.name}
              </th>
            ))}
            <th className="r">Blended rate</th>
          </tr>
        </thead>
        <tbody>
          {d.phases.map((p) => {
            const r = result.phases[p.id];
            const off = Math.abs(r.mixTotal - 1) > 0.0005;
            return (
              <tr key={p.id}>
                <td>
                  {p.name}
                  {off && (
                    <span role="alert" className="block text-xs text-bad">
                      Adds up to {pctText(r.mixTotal)}, not 100%
                    </span>
                  )}
                </td>
                {d.roles.map((role) => (
                  <td key={role.id} className="r">
                    <NumberCell k={`mix.${p.id}.${role.id}`} />
                  </td>
                ))}
                <td className="r">{money(r.blended)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <SectionTitle note="The size of the job. Hours on the Hours tab scale with these.">Scope drivers</SectionTitle>
      <table className="table">
        <thead>
          <tr>
            <th>Driver</th>
            <th className="r">Value</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {d.drivers.map((x) => (
            <tr key={x.id}>
              <td>{x.label}</td>
              <td className="r">
                <NumberCell k={`driver.${x.id}`} />
              </td>
              <td className="max-w-[26rem] text-graphite">{x.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle note="Verisave hours for one of each unit, as a low and a high estimate.">Hours per unit</SectionTitle>
      <table className="table">
        <thead>
          <tr>
            <th>Unit</th>
            <th className="r">Low hours</th>
            <th className="r">High hours</th>
          </tr>
        </thead>
        <tbody>
          {d.units.map((u) => (
            <tr key={u.id}>
              <td>{u.label}</td>
              <td className="r">
                <NumberCell k={`unit.${u.id}.low`} />
              </td>
              <td className="r">
                <NumberCell k={`unit.${u.id}.high`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle>Commercial assumptions</SectionTitle>
      <table className="table">
        <thead>
          <tr>
            <th>Assumption</th>
            <th className="r">Value</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {d.commercial.map((c) => (
            <tr key={c.id}>
              <td>{c.label}</td>
              <td className="r">
                <NumberCell k={`com.${c.id}`} />
              </td>
              <td className="max-w-[26rem] text-graphite">{c.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Hours() {
  const { model, result } = useModel();
  const d = model.defs;
  const driver = (id: string) => d.drivers.find((x) => x.id === id)?.label ?? id;
  const t = result.totals;
  return (
    <table className="table min-w-[50rem]">
      <thead>
        <tr>
          <th>Work item</th>
          <th>How it&apos;s estimated</th>
          <th className="r">Low hours</th>
          <th className="r">High hours</th>
          <th className="r">Midpoint</th>
          <th className="r">Priced hours</th>
        </tr>
      </thead>
      <tbody>
        {d.phases.map((p) => {
          const ph = result.phases[p.id];
          return (
            <PhaseRows key={p.id} name={p.name} low={ph.low} high={ph.high} mid={ph.mid} priced={ph.priced}>
              {d.items
                .filter((it) => it.phase === p.id)
                .map((it) => {
                  const r = result.items[it.id];
                  const editable = it.basis.kind !== "unit";
                  return (
                    <tr key={it.id}>
                      <td className="max-w-[26rem]">{it.label}</td>
                      <td className="text-graphite">
                        {it.basis.kind === "fixed" && "Fixed estimate"}
                        {it.basis.kind === "unit" && `Scales with: ${driver(it.basis.driver)}`}
                        {it.basis.kind === "switch" && `Only if: ${driver(it.basis.driver)}`}
                      </td>
                      <td className="r">{editable ? <NumberCell k={`item.${it.id}.low`} /> : <Computed n={r.low} />}</td>
                      <td className="r">{editable ? <NumberCell k={`item.${it.id}.high`} /> : <Computed n={r.high} />}</td>
                      <td className="r">{hours(r.mid)}</td>
                      <td className="r">{hours(r.priced)}</td>
                    </tr>
                  );
                })}
            </PhaseRows>
          );
        })}
        <tr className="sum">
          <td>Total</td>
          <td />
          <td className="r">
            <Computed n={t.low} />
          </td>
          <td className="r">
            <Computed n={t.high} />
          </td>
          <td className="r">{hours(t.mid)}</td>
          <td className="r">{hours(t.priced)}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** A calculated number, padded to line up with the editable cells beside it. */
function Computed({ n }: { n: number }) {
  return <span className="inline-block px-[0.45rem]">{hours(n)}</span>;
}

function PhaseRows(props: { name: string; low: number; high: number; mid: number; priced: number; children: React.ReactNode }) {
  return (
    <>
      <tr className="group">
        <td colSpan={2}>{props.name}</td>
        <td className="r">
          <Computed n={props.low} />
        </td>
        <td className="r">
          <Computed n={props.high} />
        </td>
        <td className="r">{hours(props.mid)}</td>
        <td className="r">{hours(props.priced)}</td>
      </tr>
      {props.children}
    </>
  );
}

function Payments() {
  const { model, result } = useModel();
  const d = model.defs;
  const phaseName = (id: PhaseId) => d.phases.find((p) => p.id === id)?.name ?? id;
  return (
    <table className="table min-w-[44rem]">
      <thead>
        <tr>
          <th>Phase</th>
          <th>Milestone</th>
          <th className="r">Share of phase fee</th>
          <th className="r">Amount</th>
          <th>Indicative week</th>
        </tr>
      </thead>
      <tbody>
        {d.milestones.map((m, i) => {
          const first = i === 0 || d.milestones[i - 1].phase !== m.phase;
          const share = result.paymentShareByPhase[m.phase];
          const off = Math.abs(share - 1) > 0.0005;
          return (
            <tr key={m.id}>
              <td>
                {first && (
                  <>
                    <span className="font-semibold">{phaseName(m.phase)}</span>
                    {off && (
                      <span role="alert" className="block text-xs text-bad">
                        Shares add up to {pctText(share)}, not 100%
                      </span>
                    )}
                  </>
                )}
              </td>
              <td>{m.label}</td>
              <td className="r">
                <NumberCell k={`pay.${m.id}.share`} />
              </td>
              <td className="r">{money(result.payments[m.id])}</td>
              <td>Week {m.week}</td>
            </tr>
          );
        })}
        <tr className="sum">
          <td>Total</td>
          <td />
          <td />
          <td className="r">{money(Object.values(result.payments).reduce((a, b) => a + b, 0))}</td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}

function ChangeOrders() {
  const { model, result } = useModel();
  const d = model.defs;
  return (
    <>
      <p className="mb-3 max-w-[70ch] text-graphite">
        Priced add-ons outside the base scope. Each is its hours times the blended rate of the phase it belongs to,
        rounded up.
      </p>
      <table className="table min-w-[44rem]">
        <thead>
          <tr>
            <th>Change</th>
            <th>Unit</th>
            <th className="r">Hours per unit</th>
            <th>Priced at the rate of</th>
            <th className="r">Fee per unit</th>
          </tr>
        </thead>
        <tbody>
          {d.changes.map((c) => (
            <tr key={c.id}>
              <td className="max-w-[24rem]">{c.label}</td>
              <td>{c.unit}</td>
              <td className="r">
                <NumberCell k={`co.${c.id}.hours`} />
              </td>
              <td className="text-graphite">
                {d.phases.find((p) => p.id === c.phase)?.name} ({money(result.changes[c.id].rate)}/hr)
              </td>
              <td className="r font-semibold">{money(result.changes[c.id].fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
