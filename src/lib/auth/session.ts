import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

/**
 * Sessions d'administration en base (table `sessions`).
 * Le cookie ne contient que le jeton aléatoire ; la base ne stocke que son SHA-256.
 * Deux étapes : `password` (courte, en attente du 2ᵉ facteur) puis `totp` (session pleine).
 */
export const SESSION_COOKIE = "wk_admin_session";
export const FULL_TTL_SECONDS = 7 * 24 * 60 * 60;
export const PENDING_TTL_SECONDS = 10 * 60;
const TOUCH_INTERVAL_SECONDS = 60 * 60;

export type SessionStage = "pending" | "active";

export type AdminAccount = {
  id: string;
  email: string;
  password_hash: string;
  totp_enabled: boolean;
  totp_secret_enc: string | null;
  totp_last_step: string;
};

export type SessionRow = {
  id: string;
  admin_id: string;
  stage: SessionStage;
  second_factor_at: string | null;
  expires_at: string;
  last_seen_at: string;
};

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export const hashIp = (ip: string): string => createHash("sha256").update(`ip:${ip}`).digest("hex");

export async function createSession(
  adminId: string,
  options: { stage: SessionStage; ttlSeconds: number; ip?: string; userAgent?: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const rows = await query<{ expires_at: string }>(
    `insert into sessions (token_hash, admin_id, stage, created_at, last_seen_at, expires_at, ip_hash, user_agent)
     values ($1, $2, $3, now(), now(), now() + ($4 || ' seconds')::interval, $5, $6)
     returning expires_at`,
    [
      hashToken(token),
      adminId,
      options.stage,
      String(options.ttlSeconds),
      options.ip ? hashIp(options.ip) : null,
      options.userAgent?.slice(0, 300) ?? null,
    ],
  );
  return { token, expiresAt: new Date(rows[0].expires_at) };
}

export async function findSessionByToken(token: string): Promise<SessionRow | null> {
  const rows = await query<SessionRow>(
    `select id, admin_id, stage, second_factor_at, expires_at, last_seen_at
       from sessions where token_hash = $1 and expires_at > now() limit 1`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function findAdminByEmail(email: string): Promise<AdminAccount | null> {
  const rows = await query<AdminAccount>(
    `select id, email, password_hash, totp_enabled, totp_secret_enc, totp_last_step
       from admin where lower(email) = lower($1) limit 1`,
    [email.trim()],
  );
  return rows[0] ?? null;
}

export async function findAdminById(id: string): Promise<AdminAccount | null> {
  const rows = await query<AdminAccount>(
    `select id, email, password_hash, totp_enabled, totp_secret_enc, totp_last_step from admin where id = $1 limit 1`,
    [id],
  );
  return rows[0] ?? null;
}

/** Passe une session en attente de 2ᵉ facteur à une session pleine (7 jours glissants). */
export async function promoteSession(sessionId: string, withSecondFactor: boolean): Promise<void> {
  await query(
    `update sessions
        set stage = 'active',
            second_factor_at = case when $2 then now() else second_factor_at end,
            last_seen_at = now(),
            expires_at = now() + ($1 || ' seconds')::interval
      where id = $3`,
    [String(FULL_TTL_SECONDS), withSecondFactor, sessionId],
  );
}

/**
 * Active la session APRÈS validation du 2ᵉ facteur, en deux temps indissociables :
 *  1. la ligne en base passe à 7 jours ;
 *  2. le cookie est reposé avec la même durée.
 * Si l'étape 2 est oubliée, le navigateur jette le cookie au bout des 10 minutes de la
 * session « en attente » : l'admin croit être déconnecté alors que la base le reconnaît.
 */
export async function activateSession(sessionId: string): Promise<void> {
  await promoteSession(sessionId, true);
  const token = await readSessionToken();
  if (!token) return; // cookie absent (session ouverte ailleurs) : la base reste la référence
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions(FULL_TTL_SECONDS));
}

/** Prolonge la session (7 jours glissants) au plus une fois par heure. */
export async function touchSession(session: SessionRow): Promise<void> {
  const lastSeen = new Date(session.last_seen_at).getTime();
  if (Date.now() - lastSeen < TOUCH_INTERVAL_SECONDS * 1000) return;
  await query(`update sessions set last_seen_at = now(), expires_at = now() + ($1 || ' seconds')::interval where id = $2`, [
    String(FULL_TTL_SECONDS),
    session.id,
  ]);
}

export async function destroySessionByToken(token: string): Promise<void> {
  await query(`delete from sessions where token_hash = $1`, [hashToken(token)]);
}

export async function destroyAllSessions(adminId: string): Promise<void> {
  await query(`delete from sessions where admin_id = $1`, [adminId]);
}

export async function purgeExpiredSessions(): Promise<void> {
  await query(`delete from sessions where expires_at < now() - interval '1 day'`);
}

/* ---------- cookie ---------- */

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function readSessionToken(): Promise<string | undefined> {
  return cookies().get(SESSION_COOKIE)?.value;
}

export async function currentSession(): Promise<{ session: SessionRow; admin: AdminAccount } | null> {
  const token = await readSessionToken();
  if (!token) return null;
  const session = await findSessionByToken(token);
  if (!session) return null;
  const admin = await findAdminById(session.admin_id);
  if (!admin) return null;
  return { session, admin };
}
