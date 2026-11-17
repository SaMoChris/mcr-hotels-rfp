"use client";

import Link from "next/link";
import { useLoad } from "@/lib/client";
import { hours, money, whole } from "@/lib/format";
import { Notice, useMe } from "./AppShell";
import { HistoryList, type HistoryItem } from "./HistoryView";
import { useModelLoader } from "./model";

type Task = { id: number; title: string; phase: string; owner: string; status: string; due: string | null };
type Project = { tasks: Task[]; questions: { id: number; status: string; audience: string }[] };

export function Overview() {
  const me = useMe();
  const { ctx, error } = useModelLoader();
  const history = useLoad<{ items: HistoryItem[] }>("/api/history?limit=6", 30_000);
  const project = useLoad<Project>("/api/project", 60_000);

  const tasks = project.data?.tasks ?? [];
  const open = tasks.filter((t) => t.status !== "done");
  const next = open.slice(0, 5);
  const openQuestions = (project.data?.questions ?? []).filter((q) => q.status === "open").length;

  return (
    <>
      <section className="rounded-xl bg-night px-6 py-7 text-white sm:px-9 sm:py-9">
        <p className="text-white/65">{me ? `Welcome, ${me.name}.` : ""}</p>
        <h1 className="display mt-1 max-w-[24ch] text-[1.9rem] sm:text-[2.3rem]">
          MCR Hotels payments audit and processor RFP
        </h1>
        {error && <p className="mt-4 text-orange">{error}</p>}
        {ctx && (
          <>
            <p className="mt-6 text-white/70">Estimate for all phases, with contingency</p>
            <p className="display num text-[2.6rem] text-orange sm:text-[3.4rem]">{money(ctx.result.totals.quoted)}</p>
            <p className="mt-2 max-w-[62ch] text-white/75">
              {whole(ctx.result.totals.priced)} priced hours at about {money(ctx.result.totals.effectiveRate)} an hour,{" "}
              {hours(ctx.result.totals.bps)} basis points of a year of MCR&apos;s card volume. Phase 0 is{" "}
              {money(ctx.result.totals.phase0)} and is paid first. MCR picks its consultant the week of December 7, 2026.
            </p>
            <GateRail ctx={ctx} />
          </>
        )}
      </section>

      <div className="mt-10 grid gap-x-12 gap-y-10 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">Latest changes</h2>
            <Link href="/history" className="link text-sm">
              See the full history
            </Link>
          </div>
          {history.error && <Notice kind="error">{history.error}</Notice>}
          {history.data &&
            (history.data.items.length ? (
              <HistoryList items={history.data.items} />
            ) : (
              <p className="text-graphite">
                Nothing has been changed yet. Open the <Link href="/model" className="link">Pricing model</Link> and edit a
                tinted cell to start.
              </p>
            ))}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">Project plan</h2>
            <Link href="/project" className="link text-sm">
              Open the plan
            </Link>
          </div>
          {project.error && <Notice kind="error">{project.error}</Notice>}
          {project.data && (
            <>
              <p className="text-graphite">
                {open.length} of {tasks.length} tasks still open, {tasks.filter((t) => t.status === "blocked").length}{" "}
                blocked. {openQuestions} open questions.
              </p>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {next.map((t) => (
                  <li key={t.id} className="py-2.5">
                    <p>{t.title}</p>
                    <p className="text-sm text-mute">
                      {t.phase}
                      {t.owner ? `, ${t.owner}` : ", no owner yet"}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}

/** The engagement on a week scale: one bar per phase, ending at its gate. */
function GateRail({ ctx }: { ctx: NonNullable<ReturnType<typeof useModelLoader>["ctx"]> }) {
  const phases = ctx.model.defs.phases;
  const last = Math.max(...phases.map((p) => p.weeks[1]));
  const at = (week: number) => ((week - 1) / (last - 1)) * 100;
  const ticks = [...new Set(phases.map((p) => p.weeks[0]))];

  return (
    <div className="mt-9">
      <ol className="space-y-3">
        {phases.map((p) => (
          <li key={p.id} className="grid items-center gap-x-5 gap-y-1 md:grid-cols-[13.5rem_minmax(0,1fr)_6rem]">
            <div>
              <p className="font-semibold">{p.name}</p>
            </div>
            <div className="relative h-6" aria-hidden="true">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
              <div
                className={`absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm ${p.id === "p0" ? "bg-orange" : "bg-white/85"}`}
                style={{ left: `${at(p.weeks[0])}%`, width: `${Math.max(at(p.weeks[1]) - at(p.weeks[0]), 1)}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-night bg-orange"
                style={{ left: `${at(p.weeks[1])}%` }}
              />
            </div>
            <p className="num text-white/80 md:text-right">
              <span className="md:hidden">
                Weeks {p.weeks[0]}–{p.weeks[1]}, {p.gate}:{" "}
              </span>
              {money(ctx.result.phases[p.id].quoted)}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-2 hidden md:grid md:grid-cols-[13.5rem_minmax(0,1fr)_6rem] md:gap-x-5" aria-hidden="true">
        <span />
        <div className="relative h-5 text-xs text-white/55">
          {ticks.map((w) => (
            <span key={w} className="absolute -translate-x-1/2" style={{ left: `${at(w)}%` }}>
              {w === 1 ? "Week 1" : w}
            </span>
          ))}
          <span className="absolute right-0 translate-x-1/2">{last}</span>
        </div>
        <span />
      </div>
      <p className="mt-4 text-sm text-white/55">
        Each bar ends at a gate (the orange diamond) that MCR signs off before the next phase starts.
      </p>
    </div>
  );
}
