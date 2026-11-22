import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";
import { readFileSync } from "node:fs";

/**
 * Vérifie que les migrations reconstituées (0002, 0003) recréent bien le schéma.
 * Tout se passe dans UNE transaction annulée à la fin : aucune donnée n'est modifiée.
 *   npx tsx scripts/verify-migrations.ts
 */
async function main() {
  loadEnv();
  const client = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await client.connect();
  await client.query("set statement_timeout = '20s'");

  const checks: [string, string[]][] = [
    ["0002_auth", ["admin", "sessions", "auth_attempts", "password_resets", "recovery_codes"]],
    ["0003_versions", ["document_versions"]],
  ];

  try {
    for (const [file, tables] of checks) {
      await client.query("begin");
      for (const t of tables) await client.query(`drop table if exists public.${t} cascade`);

      const sql = readFileSync(`db/migrations/${file}.sql`, "utf8");
      await client.query(sql);

      for (const t of tables) {
        const exists = await client.query<{ n: number }>(
          `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name=$1`,
          [t],
        );
        if (exists.rows[0].n !== 1) throw new Error(`${file} : la table ${t} n'a pas été recréée`);
      }
      await client.query("rollback");
      console.log(`${file} : ${tables.length} table(s) recréée(s) avec succès (transaction annulée)`);
    }
  } catch (error) {
    await client.query("rollback").catch(() => {});
    console.error("ÉCHEC :", error instanceof Error ? error.message : error);
    await client.end();
    process.exit(1);
  }

  // contrôle final : les tables sont toujours là, avec leurs données
  const after = await client.query<{ n: number }>(`select count(*)::int as n from admin`);
  console.log(`après vérification : ${after.rows[0].n} compte(s) admin intact(s)`);
  await client.end();
}

main().catch((error) => {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exit(1);
});
