import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";

/** Inspection ponctuelle du schéma réel (aucun secret affiché). Usage : npx tsx scripts/inspect-schema.ts */
async function main() {
  loadEnv();
  const c = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await c.connect();

  const m = await c.query("select * from schema_migrations order by version");
  console.log("schema_migrations:", m.fields.map((f) => f.name).join(", "));
  for (const r of m.rows) console.log("  ", JSON.stringify(r).slice(0, 200));

  const t = await c.query<{ table_name: string; column_name: string; data_type: string }>(
    `select table_name, column_name, data_type from information_schema.columns
      where table_schema='public' and table_name in ('admin','sessions','auth_attempts','password_resets','recovery_codes','document_versions','activity','messages','media')
      order by table_name, ordinal_position`,
  );
  const by: Record<string, string[]> = {};
  for (const r of t.rows) (by[r.table_name] ||= []).push(`${r.column_name}:${r.data_type}`);
  for (const k of Object.keys(by)) console.log(`  ${k} -> ${by[k].join(", ")}`);

  await c.end();
}

main().catch((e) => {
  console.error("erreur:", e instanceof Error ? e.message : e);
  process.exit(1);
});
