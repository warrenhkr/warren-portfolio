import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv, requireUrl } from "./lib/env";
import { isLocalDatabaseUrl } from "../src/lib/pg-options";

/** npm run db:backup [-- fichier.dump] — sauvegarde complète du schéma public au format pg_dump « custom ». Requiert pg_dump. */
function dsn(raw: string) {
  const u = new URL(raw);
  u.searchParams.delete("sslmode");
  if (!isLocalDatabaseUrl(raw)) u.searchParams.set("sslmode", "require");
  return u.toString();
}

loadEnv();
const url = requireUrl("DATABASE_URL_DIRECT", "DATABASE_URL");
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const out = resolve(process.cwd(), process.argv[2] ?? `backups/portfolio-${stamp}.dump`);
mkdirSync(resolve(out, ".."), { recursive: true });

const r = spawnSync("pg_dump", ["--format=custom", "--schema=public", "--no-owner", "--no-privileges", `--file=${out}`, dsn(url)], { stdio: ["ignore", "inherit", "inherit"] });
if (r.error) { console.error("✖ pg_dump est introuvable. Installez les outils clients PostgreSQL (voir docs/BACKUP-RESTORE.md)."); process.exit(1); }
if (r.status !== 0) { console.error("✖ La sauvegarde a échoué."); process.exit(r.status ?? 1); }
console.log(`✔ Sauvegarde créée : ${out} (${(statSync(out).size / 1024).toFixed(0)} Ko)`);
