"use client";

import Link from "next/link";
import { useState } from "react";
import { useLoad } from "@/lib/client";
import { when } from "@/lib/format";
import { Notice, PageHeader } from "./AppShell";
import { Markdown } from "./Markdown";

type Proposal = { markdown: string; lastEdit: { by: string; at: string } | null };

export function ProposalView() {
  const { data, error } = useLoad<Proposal>("/api/proposal", 30_000);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
      <PageHeader
        title="Proposed solution and fees"
        lead="Written from the pricing model, so every fee, hour and assumption here matches what the team has saved. To change a number, change it in the model."
      >
        <button onClick={copy} disabled={!data} className="btn btn-quiet">
          {copied ? "Copied" : "Copy as Markdown"}
        </button>
      </PageHeader>
      {error && <Notice kind="error">{error}</Notice>}
      {!data ? (
        !error && <p className="text-mute">Writing the proposal from the model…</p>
      ) : (
        <>
          <p className="mb-6 text-sm text-mute">
            {data.lastEdit
              ? `Model last changed by ${data.lastEdit.by}, ${when(data.lastEdit.at)}.`
              : "The model is at its starting values."}{" "}
            <Link href="/model" className="link">
              Open the pricing model
            </Link>
          </p>
          <Markdown text={data.markdown} wide />
        </>
      )}
    </>
  );
}
