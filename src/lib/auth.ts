import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "./db";

// Passwordless sign-in: a person enters their work email, and the browser gets
// a signed cookie that remembers them. The email is checked against an
// allowlist but is NOT verified by sending a message to it.

export const SESSION_COOKIE = "mcr_session";
const SESSION_DAYS = 180;

export type User = { id: number; email: string; name: string | null };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not set (use a random string of 32+ characters).");
  }
  return "dev-only-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeToken(userId: number): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_DAYS * 86_400_000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): number | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: number; exp: number };
    if (typeof data.uid !== "number" || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export async function setSession(userId: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const uid = readToken(store.get(SESSION_COOKIE)?.value);
  if (uid === null) return null;
  const rows = await query<User>("SELECT id, email, name FROM users WHERE id = $1", [uid]);
  return rows[0] ?? null;
}

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/**
 * Who may sign in. ALLOWED_EMAIL_DOMAINS defaults to verisave.com; set it to *
 * to allow any address. ALLOWED_EMAILS adds individual addresses.
 */
export function emailAllowed(email: string): boolean {
  const domains = list(process.env.ALLOWED_EMAIL_DOMAINS ?? "verisave.com");
  const emails = list(process.env.ALLOWED_EMAILS);
  if (domains.includes("*")) return true;
  if (emails.includes(email)) return true;
  const domain = email.split("@")[1] ?? "";
  return domains.includes(domain);
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
