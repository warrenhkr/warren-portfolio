import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Charge .env.local puis .env (sans écraser les variables déjà définies). Évite une dépendance dotenv. */
export function loadEnv(root = process.cwd()): void {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || m[1] in process.env) continue;
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

export function requireUrl(...names: string[]): string {
  for (const n of names) if (process.env[n]) return process.env[n] as string;
  throw new Error(`Variable d'environnement manquante : ${names.join(" ou ")} (voir .env.example).`);
}
