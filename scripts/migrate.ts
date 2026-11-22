import { Client } from "pg";
import { resolve } from "node:path";
import { loadEnv, requireUrl } from "./lib/env";
import { migrate, migrationStatus } from "./lib/migrate";
import { buildPgConfig } from "../src/lib/pg-options";

/** npm run db:migrate · npm run db:status — utilise DATABASE_URL_DIRECT si défini (connexion « session »), sinon DATABASE_URL. */
async function main() {
  loadEnv();
  const client = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL")));
  await client.connect();
  const dir = resolve(process.cwd(), "db/migrations");
  try {
    if (process.argv[2] === "status") {
      for (const s of await migrationStatus(client, dir)) console.log(`${s.version}_${s.name} : ${s.state}`);
      return;
    }
    const r = await migrate(client, dir);
    console.log(r.applied.length ? `Migrations appliquées : ${r.applied.join(", ")}` : "Base à jour : aucune migration à appliquer.");
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
