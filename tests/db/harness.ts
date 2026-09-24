/**
 * Test harness: a real PostgreSQL (PGlite, in-process) with the Supabase
 * stand-in + our migrations + the seed applied, and helpers to run queries
 * as an anonymous visitor, a logged-in user, or the project owner.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(__dirname, "../..");
const migrationsDir = path.join(root, "supabase/migrations");

let shared: Promise<PGlite> | null = null;

/**
 * Returns a clean database. Building Postgres + running the migrations is
 * slow, so it happens once per test file; between tests every table is
 * emptied and the service catalogue re-seeded.
 */
export async function createTestDb(): Promise<PGlite> {
  shared ??= buildDb();
  const db = await shared;
  await db.exec(`
    reset role;
    truncate public.appointments, public.availability_exceptions, public.availability_rules,
             public.services, public.profiles, auth.users cascade;
  `);
  await db.exec(readFileSync(path.join(root, "supabase/seed.sql"), "utf8"));
  return db;
}

async function buildDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(path.join(__dirname, "supabase-stub.sql"), "utf8"));
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(migrationsDir, file), "utf8"));
  }
  return db;
}

type Who = "anon" | { uid: string };

/** Runs one statement as a visitor (anon) or as a logged-in user. */
export async function as<T = Record<string, unknown>>(
  db: PGlite,
  who: Who,
  sql: string,
  params: unknown[] = [],
) {
  const uid = who === "anon" ? "" : who.uid;
  const role = who === "anon" ? "anon" : "authenticated";
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
  await db.exec(`set role ${role}`);
  try {
    return await db.query<T>(sql, params);
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

/** Creates an Auth user (as Supabase Auth would) and returns its id. */
export async function createUser(
  db: PGlite,
  email: string,
  metadata: Record<string, unknown> = { full_name: "Test Patient", phone: "0612345678" },
): Promise<string> {
  const res = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [email, JSON.stringify(metadata)],
  );
  return res.rows[0].id;
}

/** Promotes a user to admin the approved way: direct SQL by the owner. */
export async function promoteToAdmin(db: PGlite, uid: string) {
  await db.query("update public.profiles set role = 'admin' where id = $1", [uid]);
}

/** A date string (YYYY-MM-DD) N days from today, in Morocco time. */
export async function localDate(db: PGlite, offsetDays: number): Promise<string> {
  const res = await db.query<{ d: string }>(
    "select to_char(public.now_local()::date + $1::int, 'YYYY-MM-DD') as d",
    [offsetDays],
  );
  return res.rows[0].d;
}

export async function serviceId(db: PGlite, name: string): Promise<string> {
  const res = await db.query<{ id: string }>("select id from public.services where name = $1", [name]);
  return res.rows[0].id;
}
