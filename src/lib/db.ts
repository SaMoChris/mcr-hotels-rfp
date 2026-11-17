import "server-only";
import { Pool, type PoolClient } from "pg";
import { SEED_QUESTIONS, SEED_TASKS } from "./content/project-seed";

// One small connection pool per server instance. On Vercel, DATABASE_URL comes
// from the Neon integration; locally it comes from .env.local.

type Row = Record<string, unknown>;
export type Q = <T = Row>(text: string, params?: unknown[]) => Promise<T[]>;

const g = globalThis as unknown as { __mcrPool?: Pool; __mcrReady?: Promise<void> };

function pool(): Pool {
  if (!g.__mcrPool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Connect a Postgres database (see README).");
    }
    g.__mcrPool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
  }
  return g.__mcrPool;
}

const SCHEMA_VERSION = "1";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS app_meta (key text PRIMARY KEY, value text NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS model_values (
  key text PRIMARY KEY,
  value double precision NOT NULL,
  updated_by int REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS doc_sections (
  doc text NOT NULL,
  key text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  updated_by int REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (doc, key)
);
CREATE TABLE IF NOT EXISTS tasks (
  id serial PRIMARY KEY,
  title text NOT NULL,
  phase text NOT NULL,
  owner text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  due date,
  notes text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 0,
  updated_by int REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS questions (
  id serial PRIMARY KEY,
  question text NOT NULL,
  audience text NOT NULL,
  owner text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  answer text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 0,
  updated_by int REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS history (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id),
  area text NOT NULL,
  entity text NOT NULL,
  label text NOT NULL,
  action text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS history_created_idx ON history (created_at DESC);
`;

async function init(): Promise<void> {
  const p = pool();
  try {
    const r = await p.query("SELECT value FROM app_meta WHERE key = 'schema'");
    if (r.rows[0]?.value === SCHEMA_VERSION) return;
  } catch {
    // app_meta does not exist yet: first run.
  }
  const c = await p.connect();
  try {
    await c.query("BEGIN");
    // Stops two cold starts from creating and seeding at the same time.
    await c.query("SELECT pg_advisory_xact_lock(727001)");
    await c.query(SCHEMA_SQL);
    const seeded = await c.query("SELECT 1 FROM app_meta WHERE key = 'seeded'");
    if (!seeded.rowCount) {
      let i = 0;
      for (const t of SEED_TASKS) {
        await c.query("INSERT INTO tasks (title, phase, owner, notes, position) VALUES ($1, $2, $3, $4, $5)", [
          t.title,
          t.phase,
          t.owner,
          t.notes ?? "",
          i++,
        ]);
      }
      i = 0;
      for (const q of SEED_QUESTIONS) {
        await c.query("INSERT INTO questions (question, audience, position) VALUES ($1, $2, $3)", [
          q.question,
          q.audience,
          i++,
        ]);
      }
      await c.query("INSERT INTO app_meta (key, value) VALUES ('seeded', '1')");
    }
    await c.query(
      "INSERT INTO app_meta (key, value) VALUES ('schema', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [SCHEMA_VERSION],
    );
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

function ready(): Promise<void> {
  if (!g.__mcrReady) {
    g.__mcrReady = init().catch((e) => {
      g.__mcrReady = undefined;
      throw e;
    });
  }
  return g.__mcrReady;
}

export const query: Q = async (text, params) => {
  await ready();
  const r = await pool().query(text, params as unknown[]);
  return r.rows;
};

/** Runs several statements as one all-or-nothing change. */
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  await ready();
  const c: PoolClient = await pool().connect();
  try {
    await c.query("BEGIN");
    const out = await fn(async (text, params) => (await c.query(text, params as unknown[])).rows);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
