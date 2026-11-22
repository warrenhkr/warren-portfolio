import "server-only";
import { query } from "@/lib/db";

/**
 * État de sécurité de l'ADMIN — lecture seule.
 *
 * Règle : on n'affiche AUCUN secret (ni `totp_secret_enc`, ni empreinte d'IP, ni jeton de session).
 * Seulement des faits vérifiables : le second facteur est-il actif, combien de codes de secours
 * restent, combien de sessions vivent, et quels événements d'authentification ont eu lieu.
 */

export type SecurityState = {
  account: { email: string; totpEnabled: boolean; updatedAt: string; createdAt: string };
  recovery: { total: number; remaining: number };
  sessions: { active: number; expired: number; oldestExpiry: string | null; newestSeen: string | null };
  attempts: { total24h: number; lastFailure: string | null };
  events: { action: string; total: number; last: string }[];
  keysConfigured: { totpKey: boolean };
};

type Row = {
  email: string;
  totp_enabled: boolean;
  updated_at: string;
  created_at: string;
  codes_total: number;
  codes_remaining: number;
  sessions_active: number;
  sessions_expired: number;
  oldest_expiry: string | null;
  newest_seen: string | null;
  attempts_24h: number;
  last_failure: string | null;
  events: { action: string; total: number; last: string }[] | null;
};

/** La clé TOTP est-elle présente et de la bonne taille ? (aucune valeur n'est exposée.) */
export function isTotpKeyConfigured(): boolean {
  const raw = process.env.ADMIN_TOTP_KEY;
  if (!raw) return false;
  return Buffer.from(raw, "base64").length === 32;
}

export async function readSecurityState(): Promise<SecurityState | null> {
  const rows = await query<Row>(
    `select a.email,
            a.totp_enabled,
            a.updated_at,
            a.created_at,
            (select count(*)::int from recovery_codes c where c.admin_id = a.id)                        as codes_total,
            (select count(*)::int from recovery_codes c where c.admin_id = a.id and c.used_at is null)  as codes_remaining,
            (select count(*)::int from sessions s where s.expires_at > now())                            as sessions_active,
            (select count(*)::int from sessions s where s.expires_at <= now())                           as sessions_expired,
            (select min(s.expires_at) from sessions s where s.expires_at > now())                        as oldest_expiry,
            (select max(s.last_seen_at) from sessions s where s.expires_at > now())                      as newest_seen,
            (select count(*)::int from auth_attempts t where t.at > now() - interval '24 hours')          as attempts_24h,
            (select max(t.at) from auth_attempts t)                                                      as last_failure,
            (select coalesce(json_agg(e), '[]'::json) from (
               select action, count(*)::int as total, max(at) as last
                 from activity
                where action like 'auth.%' and at > now() - interval '7 days'
                group by action
             ) e)                                                                                        as events
       from admin a
      order by a.created_at
      limit 1`,
  );

  const row = rows[0];
  if (!row) return null;

  return {
    account: {
      email: row.email,
      totpEnabled: Boolean(row.totp_enabled),
      updatedAt: new Date(row.updated_at).toISOString(),
      createdAt: new Date(row.created_at).toISOString(),
    },
    recovery: { total: Number(row.codes_total), remaining: Number(row.codes_remaining) },
    sessions: {
      active: Number(row.sessions_active),
      expired: Number(row.sessions_expired),
      oldestExpiry: row.oldest_expiry ? new Date(row.oldest_expiry).toISOString() : null,
      newestSeen: row.newest_seen ? new Date(row.newest_seen).toISOString() : null,
    },
    attempts: {
      total24h: Number(row.attempts_24h),
      lastFailure: row.last_failure ? new Date(row.last_failure).toISOString() : null,
    },
    events: Array.isArray(row.events)
      ? row.events.map((event) => ({ action: event.action, total: Number(event.total), last: new Date(event.last).toISOString() }))
      : [],
    keysConfigured: { totpKey: isTotpKeyConfigured() },
  };
}
