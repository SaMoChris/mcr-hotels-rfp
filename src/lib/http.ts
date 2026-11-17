import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getSessionUser, type User } from "./auth";
import type { Q } from "./db";

export const ok = (data: unknown, status = 200) => Response.json(data, { status });
export const fail = (error: string, status: number) => Response.json({ error }, { status });

export type Member = User & { name: string };

/** Wraps a route handler: requires a signed-in person with a finished profile. */
export async function withMember(fn: (user: Member) => Promise<Response>): Promise<Response> {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Sign in to continue.", 401);
    if (!user.name) return fail("Add your name to finish signing in.", 401);
    return await fn(user as Member);
  } catch (e) {
    // Let Next.js handle its own control-flow errors (such as the build-time
    // signal that this route reads cookies and must run per request).
    unstable_rethrow(e);
    console.error(e);
    return fail("The server hit a problem. Try again in a moment.", 500);
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export type HistoryEntry = {
  userId: number;
  area: "model" | "doc" | "task" | "question" | "profile";
  entity: string;
  label: string;
  action: "update" | "create" | "delete" | "reset" | "revert" | "restore";
  oldValue?: string | null;
  newValue?: string | null;
};

export async function logHistory(q: Q, h: HistoryEntry): Promise<void> {
  await q(
    "INSERT INTO history (user_id, area, entity, label, action, old_value, new_value) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [h.userId, h.area, h.entity, h.label, h.action, h.oldValue ?? null, h.newValue ?? null],
  );
}
