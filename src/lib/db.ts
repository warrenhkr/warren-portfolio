import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { buildPgConfig } from "./pg-options";

/**
 * Accès PostgreSQL (serveur uniquement : ce module ne peut pas être importé dans un composant client).
 * Sur Vercel, DATABASE_URL doit pointer vers le pooler Supabase en mode « transaction » (port 6543) ;
 * `pg` n'utilise pas de requêtes préparées nommées, ce qui est compatible avec ce mode.
 *
 * Robustesse : le pooler ferme les connexions inactives, donc `pg` peut récupérer un socket mort
 * (« Connection terminated unexpectedly »). On garde les connexions vivantes, on laisse plus de temps
 * au premier établissement (TLS + pooler ≈ 2 à 5 s) et on rejoue une fois les erreurs transitoires.
 */
const g = globalThis as unknown as { __portfolioPool?: Pool };

const CONNECTION_TIMEOUT_MS = Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 20_000);
const MAX_CLIENTS = Number(process.env.DATABASE_POOL_MAX ?? 5);
/**
 * Durée de vie d'une connexion inactive. Mesuré sur ce poste : rouvrir une connexion vers le
 * pooler Supabase coûte 1,8 à 7,6 s (TLS + DNS vers Francfort), contre ~200 ms pour une requête
 * à chaud. Laisser 5 s fermait donc le pool entre deux visites et payait ce prix à chaque page.
 * 5 minutes gardent la connexion disponible pendant la navigation sans immobiliser de slot.
 */
const IDLE_TIMEOUT_MS = Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 300_000);
const RETRYABLE = /Connection terminated|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|server closed the connection/i;

export const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

export function getPool(): Pool {
  if (!g.__portfolioPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL n'est pas défini.");
    const pool = new Pool(
      buildPgConfig(url, {
        max: MAX_CLIENTS,
        idleTimeoutMillis: IDLE_TIMEOUT_MS,
        connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
        keepAlive: true,
        keepAliveInitialDelayMillis: 5_000,
      }),
    );
    pool.on("error", (e) => console.error("[db] connexion inactive perdue :", e.message));
    g.__portfolioPool = pool;
  }
  return g.__portfolioPool;
}

async function runQuery<T extends QueryResultRow>(text: string, params: unknown[]): Promise<T[]> {
  return (await getPool().query<T>(text, params)).rows;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  try {
    return await runQuery<T>(text, params);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Une seule reprise : un socket mort est détecté tout de suite, une vraie panne échoue quand même.
    if (!RETRYABLE.test(message)) throw error;
    console.warn("[db] nouvelle tentative après une connexion perdue :", message);
    return runQuery<T>(text, params);
  }
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
