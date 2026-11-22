import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";
import { loadMigrations } from "./lib/migrate";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Adopte des migrations reconstituées : lorsque la version est déjà enregistrée en base
 * mais que le fichier local a été régénéré (empreinte différente), on aligne l'empreinte
 * enregistrée sur le fichier. Sans cela, `db:migrate` refuse de continuer — et une machine
 * neuve ne pourrait pas recréer le schéma.
 *
 *   npx tsx scripts/adopt-migrations.ts            → affiche ce qui changerait
 *   npx tsx scripts/adopt-migrations.ts --confirm   → écrit les nouvelles empreintes
 *
 * Ne touche ni aux tables, ni aux données : uniquement la table `schema_migrations`.
 */
async function main() {
  loadEnv();
  const confirm = process.argv.includes("--confirm");
  const dir = "db/migrations";
  const client = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await client.connect();

  const rows = (await client.query("select version, name, checksum from schema_migrations")).rows as {
    version: string;
    name: string;
    checksum: string;
  }[];
  const recorded = new Map(rows.map((r) => [r.version, r]));

  const pending: { version: string; name: string; from: string; to: string }[] = [];
  for (const m of loadMigrations(dir)) {
    const known = recorded.get(m.version);
    if (!known) continue;
    if (known.checksum !== m.checksum) pending.push({ version: m.version, name: m.name, from: known.checksum.slice(0, 10), to: m.checksum.slice(0, 10) });
  }

  // Vérification de cohérence : chaque table du dump doit apparaître dans les migrations locales.
  const tables = (
    await client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1",
    )
  ).rows.map((r) => r.table_name);
  const localSql = loadMigrations(dir).map((m) => m.sql).join("\n").toLowerCase();
  const missing = tables.filter((t) => t !== "schema_migrations" && !localSql.includes(`create table public.${t}`) && !localSql.includes(`create table ${t}`));

  console.log(`tables en base : ${tables.length} | absentes des migrations locales : ${missing.length ? missing.join(", ") : "aucune"}`);
  if (pending.length === 0) console.log("aucune empreinte à aligner.");
  for (const p of pending) console.log(`  ${p.version}_${p.name} : ${p.from} → ${p.to}`);

  if (!confirm || pending.length === 0) {
    if (pending.length) console.log("\n(rien écrit — relancer avec --confirm)");
    await client.end();
    return;
  }

  for (const p of pending) {
    const file = loadMigrations(dir).find((m) => m.version === p.version)!;
    const checksum = createHash("sha256").update(readFileSync(`db/migrations/${file.version}_${file.name}.sql`, "utf8")).digest("hex");
    await client.query("update schema_migrations set checksum = $1 where version = $2", [checksum, p.version]);
  }
  console.log(`\n${pending.length} empreinte(s) alignée(s).`);
  await client.end();
}

main().catch((error) => {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exit(1);
});
