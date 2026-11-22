import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";

/**
 * Diagnostic de la base : ne révèle jamais l'URL ni les identifiants.
 * Usage : npm run db:check
 */
async function main() {
  loadEnv();
  const url = requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL");
  const client = new Client(buildPgConfig(url, { connectionTimeoutMillis: 10_000 }));

  const t0 = Date.now();
  try {
    await client.connect();
  } catch (e) {
    const err = e as { code?: string; message?: string };
    console.log(`  connexion : ÉCHEC (${err.code ?? "inconnu"})`);
    console.log(`  message  : ${(err.message ?? "").slice(0, 120)}`);
    process.exit(1);
  }
  const ms = Date.now() - t0;
  console.log(`  connexion : OK (${ms} ms)`);

  const { rows: v } = await client.query<{ v: string }>("select version() as v");
  console.log(`  serveur   : ${v[0].v.split(",")[0]}`);

  const { rows: tables } = await client.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  );
  const expected = ["documents", "schema_migrations", "media", "document_media", "messages", "activity_log"];
  const found = tables.map((t) => t.table_name);
  console.log(`  tables    : ${found.length ? found.join(", ") : "aucune"}`);
  const missing = expected.filter((t) => !found.includes(t));
  if (missing.length) console.log(`  manquantes: ${missing.join(", ")}`);

  if (found.includes("schema_migrations")) {
    const { rows: m } = await client.query<{ version: string; name: string }>("select version, name from schema_migrations order by version");
    console.log(`  migrations: ${m.length ? m.map((x) => `${x.version}_${x.name}`).join(", ") : "aucune appliquée"}`);
  }

  if (found.includes("documents")) {
    const { rows: c } = await client.query<{ collection: string; total: string; unpublished: string }>(
      `select collection, count(*)::int as total,
              count(*) filter (where has_unpublished_changes)::int as unpublished
         from documents group by collection order by collection`,
    );
    console.log(`  contenus  : ${c.length ? c.map((x) => `${x.collection}=${x.total}`).join("  ") : "base vide (db:seed à lancer)"}`);
  }

  await client.end();
}

main().catch((e) => {
  console.error("  erreur :", e instanceof Error ? e.message : e);
  process.exit(1);
});
