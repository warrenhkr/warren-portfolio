import { randomBytes } from "node:crypto";
import { chmodSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadEnv, requireUrl } from "./lib/env";
import { Client } from "pg";
import { buildPgConfig } from "../src/lib/pg-options";
import { hashPassword } from "../src/lib/auth/password";

/**
 * Réinitialise le compte d'administration (procédure de secours locale, jamais exposée par le web).
 *   npm run admin:reset            → nouveau mot de passe, second facteur DÉSACTIVÉ (ré-enrôlement à la connexion)
 *   npm run admin:reset -- --keep-totp → nouveau mot de passe, second facteur conservé
 * Le mot de passe n'est jamais affiché : il est écrit dans un fichier lisible par toi seul.
 */
async function main() {
  loadEnv();
  const keepTotp = process.argv.includes("--keep-totp");
  const keepPassword = process.argv.includes("--keep-password");
  const email = process.env.ADMIN_EMAIL || "warrenhkr@gmail.com";
  const password = randomBytes(15).toString("base64url");
  const hash = hashPassword(password);

  const client = new Client(buildPgConfig(requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL"), {}));
  await client.connect();

  const found = await client.query<{ id: string }>("select id from admin where lower(email) = lower($1)", [email]);
  if (found.rowCount === 0) {
    console.error(`Aucun compte pour ${email}. Utilise npm run admin:init pour en créer un.`);
    await client.end();
    process.exit(1);
  }
  const adminId = found.rows[0].id;

  await client.query(
    `update admin
        set password_hash = case when $4 then password_hash else $1 end,
            password_changed_at = case when $4 then password_changed_at else now() end,
            updated_at = now(),
            totp_enabled = case when $3 then totp_enabled else false end,
            totp_secret_enc = case when $3 then totp_secret_enc else null end,
            totp_last_step = case when $3 then totp_last_step else 0 end
      where id = $2`,
    [hash, adminId, keepTotp, keepPassword],
  );
  await client.query(`delete from sessions where admin_id = $1`, [adminId]);
  if (!keepTotp) await client.query(`delete from recovery_codes where admin_id = $1`, [adminId]);

  const file = join(homedir(), "admin-portfolio-password.txt");
  if (!keepPassword) {
    writeFileSync(file, `compte : ${email}\nmot de passe : ${password}\nsecond facteur : ${keepTotp ? "conservé" : "désactivé (enrôlement à la prochaine connexion)"}\ngénéré le : ${new Date().toISOString()}\n`);
    chmodSync(file, 0o600);
  }

  await client.end();
  console.log(`Compte réinitialisé : ${email}`);
  console.log(`Sessions révoquées, ${keepTotp ? "second facteur conservé" : "second facteur désactivé"}.`);
  if (keepPassword) {
    console.log("Mot de passe inchangé (--keep-password).");
  } else {
    console.log(`Mot de passe écrit dans ${file} (chmod 600) — il n'apparaît pas ici, volontairement.`);
  }
}

main().catch((error) => {
  console.error("Échec :", error instanceof Error ? error.message : error);
  process.exit(1);
});
