import "server-only";
import { query } from "@/lib/db";

export { attemptKey } from "./key";

/**
 * Limitation des tentatives de connexion (table `auth_attempts`).
 * Clé = portée + empreinte de l'identifiant (jamais l'e-mail en clair dans les logs).
 * Règle : MAX_ATTEMPTS échecs sur WINDOW_MINUTES minutes bloquent la tentative suivante.
 */
export const MAX_ATTEMPTS = 5;
export const WINDOW_MINUTES = 15;
const RETENTION_HOURS = 24;

export async function isRateLimited(key: string): Promise<boolean> {
  const rows = await query<{ total: number }>(
    `select count(*)::int as total from auth_attempts where key = $1 and at > now() - ($2 || ' minutes')::interval`,
    [key, String(WINDOW_MINUTES)],
  );
  return (rows[0]?.total ?? 0) >= MAX_ATTEMPTS;
}

export async function recordAttempt(key: string): Promise<void> {
  await query(`insert into auth_attempts (key, at) values ($1, now())`, [key]);
  // ménage opportuniste, sans bloquer la requête appelante en cas d'échec
  await query(`delete from auth_attempts where at < now() - ($1 || ' hours')::interval`, [String(RETENTION_HOURS)]).catch(() => undefined);
}

export async function clearAttempts(key: string): Promise<void> {
  await query(`delete from auth_attempts where key = $1`, [key]);
}

export async function attemptsRemaining(key: string): Promise<number> {
  const rows = await query<{ total: number }>(
    `select count(*)::int as total from auth_attempts where key = $1 and at > now() - ($2 || ' minutes')::interval`,
    [key, String(WINDOW_MINUTES)],
  );
  return Math.max(0, MAX_ATTEMPTS - (rows[0]?.total ?? 0));
}
