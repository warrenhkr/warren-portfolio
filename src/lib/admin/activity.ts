import "server-only";
import { query } from "@/lib/db";

/** Journal des actions sensibles (table `activity`). Échoue en silence : ne doit jamais bloquer une action. */
export async function logActivity(action: string, label?: string, details?: Record<string, unknown>): Promise<void> {
  try {
    await query(`insert into activity (at, action, label, details) values (now(), $1, $2, $3)`, [
      action,
      label ?? null,
      details ? JSON.stringify(details) : null,
    ]);
  } catch {
    /* le journal ne doit pas casser l'action qu'il trace */
  }
}

export type ActivityRow = {
  id: string;
  at: string;
  action: string;
  label: string | null;
  details: Record<string, unknown> | null;
};

export type ActivityGroup = { action: string; total: number; last: string };

export type ActivityJournal = {
  entries: ActivityRow[];
  groups: ActivityGroup[];
  total: number;
  /** Nombre d'entrées des dernières 24 h. */
  last24h: number;
};

/**
 * Lecture du journal pour l'écran « Journal d'activité ».
 * `limit` borne la page ; les compteurs portent sur toute la table (agrégat en une requête,
 * pas de N+1). Aucune donnée sensible : ni IP, ni jeton, ni secret.
 */
export async function readActivityJournal(limit = 100): Promise<ActivityJournal> {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 500) : 100;

  const [entries, groups, counters] = await Promise.all([
    query<ActivityRow>(
      `select id::text as id, at, action, label, details
         from activity
        order by at desc
        limit $1`,
      [safeLimit],
    ),
    query<ActivityGroup>(
      `select action, count(*)::int as total, max(at) as last
         from activity
        group by action
        order by max(at) desc`,
    ),
    query<{ total: number; last24h: number }>(
      `select count(*)::int as total,
              count(*) filter (where at > now() - interval '24 hours')::int as last24h
         from activity`,
    ),
  ]);

  return {
    entries: entries.map((entry) => ({
      id: entry.id,
      at: new Date(entry.at).toISOString(),
      action: entry.action,
      label: entry.label,
      details: entry.details && typeof entry.details === "object" ? entry.details : null,
    })),
    groups: groups.map((group) => ({ action: group.action, total: Number(group.total), last: new Date(group.last).toISOString() })),
    total: Number(counters[0]?.total ?? 0),
    last24h: Number(counters[0]?.last24h ?? 0),
  };
}
