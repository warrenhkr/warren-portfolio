import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv, requireUrl } from "./lib/env";
import { isLocalDatabaseUrl } from "../src/lib/pg-options";

/**
 * npm run db:restore -- fichier.dump --yes
 * Restaure une sauvegarde dans la base ciblée (REMPLACE les tables du schéma public, en une seule transaction).
 */
const file = process.argv[2];
const confirmed = process.argv.includes("--yes");
loadEnv();
const url = requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL");
const u = new URL(url);
u.searchParams.delete("sslmode");
if (!isLocalDatabaseUrl(url)) u.searchParams.set("sslmode", "require");

if (!file || !existsSync(resolve(file))) { console.error("✖ Indiquez le fichier de sauvegarde : npm run db:restore -- backups/xxx.dump --yes"); process.exit(1); }
console.log(`Cible : ${u.hostname}${u.pathname} — les données actuelles des tables du CMS seront remplacées.`);
if (!confirmed) { console.error("✖ Opération destructive : relancez avec --yes pour confirmer."); process.exit(1); }

const r = spawnSync("pg_restore", ["--clean", "--if-exists", "--schema=public", "--no-owner", "--no-privileges", "--single-transaction", `--dbname=${u.toString()}`, resolve(file)], { stdio: ["ignore", "inherit", "inherit"] });
if (r.error) { console.error("✖ pg_restore est introuvable. Installez les outils clients PostgreSQL."); process.exit(1); }
if (r.status !== 0) { console.error("✖ La restauration a échoué : aucune modification n'a été appliquée (transaction annulée)."); process.exit(r.status ?? 1); }
console.log("✔ Restauration terminée.");
