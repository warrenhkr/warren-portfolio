import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";
import { verifyPassword } from "../src/lib/auth/password";

/** Vérifie que le mot de passe du fichier correspond bien au hash en base (aucun secret affiché). */
async function main() {
  loadEnv();
  const txt = readFileSync(join(homedir(), "admin-portfolio-password.txt"), "utf8");
  const m = txt.match(/mot de passe\s*:\s*(\S+)/);
  if (!m) { console.error("fichier de mot de passe illisible"); process.exit(1); }
  const c = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await c.connect();
  const r = await c.query<{ email: string; password_hash: string; totp_enabled: boolean; secret: boolean }>(
    "select email, password_hash, totp_enabled, (totp_secret_enc is not null) as secret from admin limit 1");
  const row = r.rows[0];
  console.log(`compte          : ${row.email}`);
  console.log(`mot de passe OK : ${verifyPassword(m[1], row.password_hash)}`);
  console.log(`2FA active      : ${row.totp_enabled}`);
  console.log(`secret en attente : ${row.secret}`);
  const s = await c.query<{ n: number }>("select count(*)::int as n from sessions");
  console.log(`sessions en base : ${s.rows[0].n}`);
  await c.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
