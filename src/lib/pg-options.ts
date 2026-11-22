import { setDefaultResultOrder } from "node:dns";
import type { PoolConfig } from "pg";

/**
 * Certains réseaux (et cet environnement) n'ont pas de route IPv6 : Supabase publie
 * des enregistrements AAAA, et Node tentait l'IPv6 en premier (ENETUNREACH).
 * On privilégie IPv4 pour toutes les résolutions de ce module.
 */
setDefaultResultOrder("ipv4first");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isLocalDatabaseUrl(rawUrl: string): boolean {
  return LOCAL_HOSTS.has(new URL(rawUrl).hostname);
}

/**
 * Configuration `pg` commune à l'application et aux scripts.
 * - Connexion locale : sans TLS. Connexion distante (Supabase) : TLS obligatoire.
 * - `sslmode` est retiré de l'URL : le TLS est piloté ici, de façon explicite.
 * - DATABASE_SSL_VERIFY=true active la vérification du certificat serveur.
 */
export function buildPgConfig(rawUrl: string, overrides: PoolConfig = {}): PoolConfig {
  const url = new URL(rawUrl);
  url.searchParams.delete("sslmode");
  const ssl = isLocalDatabaseUrl(rawUrl) ? false : { rejectUnauthorized: process.env.DATABASE_SSL_VERIFY === "true" };
  return { connectionString: url.toString(), ssl, ...overrides };
}
