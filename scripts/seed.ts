import { Client } from "pg";
import { resolve } from "node:path";
import { loadEnv, requireUrl } from "./lib/env";
import { loadSeed, seed } from "./lib/seed";
import { buildPgConfig } from "../src/lib/pg-options";

/** npm run db:seed — importe le contenu initial sans jamais écraser l'existant. */
async function main() {
  loadEnv();
  const client = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL")));
  await client.connect();
  try {
    const r = await seed(client, loadSeed(resolve(process.cwd(), "db/seed/initial-content.json")));
    console.log(`Contenu initial : ${r.inserted} document(s) importé(s), ${r.skipped} déjà présent(s) (conservés tels quels).`);
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
