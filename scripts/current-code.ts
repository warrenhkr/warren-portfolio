import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";
import { decryptSecret, totpCode } from "../src/lib/auth/totp";

/**
 * Outil de VÉRIFICATION : affiche le code TOTP courant du compte, pour tester l'enrôlement
 * sans passer par une application d'authentification. Le secret n'est jamais affiché.
 *   npx tsx scripts/current-code.ts
 */
async function main() {
  loadEnv();
  const c = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await c.connect();
  const r = await c.query<{ totp_secret_enc: string | null; totp_enabled: boolean }>(
    "select totp_secret_enc, totp_enabled from admin limit 1",
  );
  await c.end();
  const row = r.rows[0];
  if (!row?.totp_secret_enc) {
    console.error("Aucun secret en attente : la page d'enrôlement doit être ouverte une première fois.");
    process.exit(1);
  }
  const secret = decryptSecret(row.totp_secret_enc);
  console.log(JSON.stringify({ code: totpCode(secret), actif: row.totp_enabled }));
}

main().catch((error) => {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exit(1);
});
