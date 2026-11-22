import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Génère les clés d'authentification manquantes dans .env.local, sans jamais les afficher.
 * - ADMIN_TOTP_KEY : 32 octets base64 (AES-256-GCM pour le secret TOTP).
 * Idempotent : une clé déjà présente n'est pas remplacée.
 */
const path = ".env.local";
const current = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
const lines = current.split(/\r?\n/);
const has = (name) => lines.some((l) => new RegExp(`^${name}=.+`).test(l));

const additions = [];
if (!has("ADMIN_TOTP_KEY")) {
  additions.push(`ADMIN_TOTP_KEY=${crypto.randomBytes(32).toString("base64")}`);
  console.log("ADMIN_TOTP_KEY : générée (32 octets)");
} else {
  console.log("ADMIN_TOTP_KEY : déjà présente, inchangée");
}

if (additions.length === 0) process.exit(0);

const next = `${current.replace(/\s*$/, "")}\n${additions.join("\n")}\n`;
fs.writeFileSync(path, next, { mode: 0o600 });
console.log(`${additions.length} ligne(s) ajoutée(s) à .env.local`);
