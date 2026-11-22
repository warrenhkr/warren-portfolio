import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";
async function main() {
  loadEnv();
  const c = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await c.connect();
  const r = await c.query(`select collection, slug, jsonb_pretty(draft) as draft, (published is not null) as publie, has_unpublished_changes from documents where collection='project' limit 1`);
  for (const row of r.rows) { console.log(`collection=${row.collection} slug=${row.slug} publie=${row.publie} a_publier=${row.has_unpublished_changes}`); console.log(row.draft?.slice(0, 1400)); }
  const s = await c.query(`select slug, left(jsonb_pretty(draft), 500) as d from documents where collection='skill' limit 1`);
  console.log("\n--- skill ---"); console.log(s.rows[0]?.d);
  await c.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
