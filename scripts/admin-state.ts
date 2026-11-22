import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";

/** État du compte d'administration (aucun secret affiché). Usage : npx tsx scripts/admin-state.ts */
async function main() {
  loadEnv();
  const c = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await c.connect();
  const r = await c.query(
    `select totp_enabled,
            (totp_secret_enc is null) as sans_secret,
            to_char(password_changed_at, 'YYYY-MM-DD HH24:MI') as mdp_modifie_a,
            (select count(*)::int from recovery_codes) as codes_secours,
            (select count(*)::int from sessions) as sessions
       from admin`,
  );
  console.log(JSON.stringify(r.rows[0], null, 1));
  await c.end();
}

main().catch((error) => {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exit(1);
});
