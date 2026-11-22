import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Client } from "pg";

export type Migration = { version: string; name: string; sql: string; checksum: string };

const FILE = /^(\d{4})_([a-z0-9_]+)\.sql$/;
const LOCK_ID = 727274; // verrou consultatif : un seul migrateur à la fois

export function loadMigrations(dir: string): Migration[] {
  return readdirSync(dir)
    .filter((f) => FILE.test(f))
    .sort()
    .map((f) => {
      const [, version, name] = f.match(FILE) as RegExpMatchArray;
      const sql = readFileSync(join(dir, f), "utf8");
      return { version, name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    });
}

async function ensureTable(client: Client) {
  await client.query(`create table if not exists schema_migrations (
    version text primary key, name text not null, checksum text not null, applied_at timestamptz not null default now())`);
  await client.query("alter table schema_migrations enable row level security");
}

export async function migrationStatus(client: Client, dir: string) {
  await ensureTable(client);
  const applied = new Map((await client.query("select version, checksum, applied_at from schema_migrations order by version")).rows.map((r) => [r.version as string, r]));
  return loadMigrations(dir).map((m) => ({
    version: m.version, name: m.name,
    state: !applied.has(m.version) ? "en attente" : applied.get(m.version).checksum === m.checksum ? "appliquée" : "MODIFIÉE",
    appliedAt: applied.get(m.version)?.applied_at as Date | undefined,
  }));
}

/** Applique, dans l'ordre et chacune dans une transaction, les migrations pas encore appliquées. */
export async function migrate(client: Client, dir: string): Promise<{ applied: string[]; alreadyApplied: string[] }> {
  await client.query("select pg_advisory_lock($1)", [LOCK_ID]);
  try {
    await ensureTable(client);
    const rows = (await client.query("select version, checksum from schema_migrations")).rows as { version: string; checksum: string }[];
    const done = new Map(rows.map((r) => [r.version, r.checksum]));
    const result = { applied: [] as string[], alreadyApplied: [] as string[] };
    for (const m of loadMigrations(dir)) {
      if (done.has(m.version)) {
        if (done.get(m.version) !== m.checksum) throw new Error(`La migration ${m.version}_${m.name} a été modifiée après son application. Ne modifiez jamais une migration appliquée : créez-en une nouvelle.`);
        result.alreadyApplied.push(m.version);
        continue;
      }
      try {
        await client.query("begin");
        await client.query(m.sql);
        await client.query("insert into schema_migrations (version, name, checksum) values ($1, $2, $3)", [m.version, m.name, m.checksum]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback").catch(() => {});
        throw new Error(`Échec de la migration ${m.version}_${m.name} (annulée) : ${(error as Error).message}`);
      }
      result.applied.push(m.version);
    }
    return result;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
  }
}
