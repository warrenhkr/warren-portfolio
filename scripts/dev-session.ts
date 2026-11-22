import { randomBytes, createHash } from "node:crypto";
import { writeFileSync, chmodSync } from "node:fs";
import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";

/**
 * Outil de VÉRIFICATION locale : crée une session d'administration directement en base,
 * pour contrôler les pages protégées sans saisir de mot de passe.
 * Le jeton est écrit dans un fichier temporaire (chmod 600), jamais affiché.
 *   npx tsx scripts/dev-session.ts [--stage password]
 */
async function main() {
  loadEnv();
  const stage = process.argv.includes("--stage") ? (process.argv[process.argv.indexOf("--stage") + 1] ?? "active") : "active";
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const client = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await client.connect();
  const admin = await client.query<{ id: string; email: string }>("select id, email from admin limit 1");
  if (admin.rowCount === 0) {
    console.error("Aucun compte administrateur.");
    process.exit(1);
  }
  const { id, email } = admin.rows[0];
  await client.query(
    `insert into sessions (token_hash, admin_id, stage, second_factor_at, created_at, last_seen_at, expires_at, user_agent)
     values ($1, $2, $3, case when $3 = 'active' then now() else null end, now(), now(), now() + interval '1 hour', 'verification-locale')`,
    [tokenHash, id, stage],
  );
  await client.end();

  const file = `/tmp/wk-session-${stage}.txt`;
  writeFileSync(file, token);
  chmodSync(file, 0o600);
  console.log(`session ${stage} créée pour ${email} — jeton écrit dans ${file}`);
}

main().catch((error) => {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exit(1);
});
