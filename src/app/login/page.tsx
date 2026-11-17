"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client";

type Step = "email" | "name";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Skip straight to the workspace, or to the name step.
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((r: { needsProfile: boolean } | null) => {
        if (!r) return;
        if (r.needsProfile) setStep("name");
        else window.location.assign("/");
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (step === "email") {
        const r = await api<{ needsProfile: boolean }>("/api/auth/login", { method: "POST", body: { email } });
        if (r.needsProfile) setStep("name");
        else window.location.assign("/");
      } else {
        await api("/api/auth/profile", { method: "POST", body: { name } });
        window.location.assign("/");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && step === "name") setStep("email");
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex flex-col justify-between bg-night px-7 py-8 text-white sm:px-12 lg:py-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/verisave-logo-reverse.svg" alt="Verisave" className="h-8 w-auto self-start" />
        <div className="py-10">
          <h1 className="display text-[2.1rem] sm:text-[2.6rem]">MCR Hotels payments audit and processor RFP</h1>
          <p className="mt-4 max-w-[46ch] text-white/75">
            The team workspace for pricing the engagement, drafting the RFP and tracking the plan.
          </p>
        </div>
        <p className="text-sm text-white/55">Internal to Verisave. Not for MCR or bidders.</p>
      </div>

      <div className="flex items-center px-7 py-10 sm:px-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          {step === "email" ? (
            <>
              <h2 className="text-xl font-semibold">Sign in with your work email</h2>
              <p className="mt-2 text-graphite">
                No password. Your email is how the team sees who made each change.
              </p>
              <label htmlFor="email" className="mt-6 block text-sm font-semibold">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@verisave.com"
                className="field mt-1.5"
              />
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">What should the team call you?</h2>
              <p className="mt-2 text-graphite">This name appears next to every change you make. You only set it once.</p>
              <label htmlFor="name" className="mt-6 block text-sm font-semibold">
                Name or alias
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                autoFocus
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field mt-1.5"
              />
            </>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-bad">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn btn-primary mt-5">
            {busy ? "One moment…" : step === "email" ? "Continue" : "Save name and enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
