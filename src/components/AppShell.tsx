"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";

type Me = { id: number; email: string; name: string };

const MeContext = createContext<Me | null>(null);
export const useMe = () => useContext(MeContext);

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/model", label: "Pricing model" },
  { href: "/proposal", label: "Proposal" },
  { href: "/scope", label: "Scope and requirements" },
  { href: "/rfp", label: "Draft RFP" },
  { href: "/project", label: "Project plan" },
  { href: "/history", label: "History" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    api<{ user: Me; needsProfile: boolean }>("/api/auth/me")
      .then((r) => {
        if (r.needsProfile) window.location.assign("/login");
        else setMe(r.user);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status !== 401) setProblem(e.message);
      });
  }, []);

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/login");
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <MeContext.Provider value={me}>
      <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="bg-night text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3 lg:block lg:pb-6">
            <Link href="/" aria-label="Overview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/verisave-logo-reverse.svg" alt="Verisave" className="h-7 w-auto" />
            </Link>
            <p className="text-sm text-white/70 lg:mt-4">MCR Hotels RFP workspace</p>
          </div>
          <nav aria-label="Sections" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:flex-1 lg:space-y-0.5 lg:overflow-visible">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`block shrink-0 rounded-md border-l-2 px-3 py-2 text-[0.95rem] whitespace-nowrap ${
                  isActive(n.href)
                    ? "border-orange bg-white/10 font-semibold text-white"
                    : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden border-t border-white/10 px-5 py-4 text-sm lg:block">
            {me ? (
              <>
                <p className="font-semibold">{me.name}</p>
                <p className="truncate text-white/60">{me.email}</p>
                <button onClick={signOut} className="mt-2 cursor-pointer text-white/70 underline underline-offset-2 hover:text-white">
                  Sign out
                </button>
              </>
            ) : (
              <p className="text-white/60">Checking who you are…</p>
            )}
          </div>
        </aside>

        <main className="min-w-0 px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {problem ? (
            <p role="alert" className="rounded-md border border-bad/30 bg-white p-4 text-bad">
              {problem}
            </p>
          ) : me ? (
            children
          ) : null}
          {me && (
            <p className="mt-12 text-sm text-mute lg:hidden">
              Signed in as {me.name}.{" "}
              <button onClick={signOut} className="link">
                Sign out
              </button>
            </p>
          )}
        </main>
      </div>
    </MeContext.Provider>
  );
}

export function PageHeader({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div>
        <h1 className="display text-[1.9rem]">{title}</h1>
        {lead && <p className="mt-2 max-w-[70ch] text-graphite">{lead}</p>}
      </div>
      {children}
    </header>
  );
}

export function Notice({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-md border bg-white px-4 py-3 text-sm ${kind === "error" ? "border-bad/30 text-bad" : "border-line text-graphite"}`}
    >
      {children}
    </p>
  );
}
