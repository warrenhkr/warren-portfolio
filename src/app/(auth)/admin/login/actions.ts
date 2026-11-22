"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { logActivity } from "@/lib/admin/activity";
import { verifyPassword } from "@/lib/auth/password";
import { attemptKey, clearAttempts, isRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import { currentPendingSession } from "@/lib/auth/require";
import {
  PENDING_TTL_SECONDS,
  SESSION_COOKIE,
  createSession,
  destroySessionByToken,
  findAdminByEmail,
  findAdminById,
  activateSession,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  otpauthUrl,
  verifyTotp,
} from "@/lib/auth/totp";

const clientIp = (): string | undefined => {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
};

/* ------------------------------- étape 1 : mot de passe ------------------------------- */

type LoginOutcome = { next?: string; error?: string };

async function performLogin(formData: FormData): Promise<LoginOutcome> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing" };

  const key = attemptKey("login", email);
  if (await isRateLimited(key)) {
    await logActivity("auth.rate_limited", email);
    return { error: "rate" };
  }

  const admin = await findAdminByEmail(email);
  const valid = admin ? verifyPassword(password, admin.password_hash) : false;

  if (!valid || !admin) {
    await recordAttempt(key);
    await logActivity("auth.failed", email);
    return { error: "creds" };
  }

  await clearAttempts(key);

  // on remplace toute session en attente existante (évite l'accumulation de brouillons de session)
  const previous = cookies().get(SESSION_COOKIE)?.value;
  if (previous) await destroySessionByToken(previous);

  const { token } = await createSession(admin.id, {
    stage: "pending",
    ttlSeconds: PENDING_TTL_SECONDS,
    ip: clientIp(),
    userAgent: headers().get("user-agent") ?? undefined,
  });
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions(PENDING_TTL_SECONDS));
  await logActivity("auth.password_ok", admin.email);

  return { next: admin.totp_enabled && admin.totp_secret_enc ? "/admin/login?step=code" : "/admin/login?step=setup" };
}

/* ------------------------------- étape 2 : code TOTP ------------------------------- */

export async function verifySecondFactor(formData: FormData): Promise<void> {
  const ctx = await currentPendingSession();
  if (!ctx) redirect("/admin/login?e=expired");

  const code = String(formData.get("code") ?? "");
  const key = attemptKey("totp", ctx.admin.id);

  if (await isRateLimited(key)) redirect("/admin/login?step=code&e=rate");
  if (!ctx.admin.totp_enabled || !ctx.admin.totp_secret_enc) redirect("/admin/login?step=setup");

  const secret = decryptSecret(ctx.admin.totp_secret_enc);
  const result = verifyTotp(secret, code, Number(ctx.admin.totp_last_step));

  if (!result.ok) {
    await recordAttempt(key);
    await logActivity("auth.totp_failed", ctx.admin.email);
    redirect("/admin/login?step=code&e=code");
  }

  await query(`update admin set totp_last_step = $1, updated_at = now() where id = $2`, [String(result.step), ctx.admin.id]);
  await clearAttempts(key);
  await activateSession(ctx.session.id);
  await logActivity("auth.login", ctx.admin.email);
  redirect("/admin");
}

/* ------------------------------- code de secours ------------------------------- */

export async function verifyRecoveryCode(formData: FormData): Promise<void> {
  const ctx = await currentPendingSession();
  if (!ctx) redirect("/admin/login?e=expired");

  const raw = String(formData.get("code") ?? "");
  const key = attemptKey("recovery", ctx.admin.id);
  if (await isRateLimited(key)) redirect("/admin/login?step=code&e=rate");

  const rows = await query<{ id: string }>(
    `update recovery_codes set used_at = now()
      where admin_id = $1 and code_hash = $2 and used_at is null
      returning id`,
    [ctx.admin.id, hashRecoveryCode(raw)],
  );

  if (rows.length === 0) {
    await recordAttempt(key);
    await logActivity("auth.recovery_failed", ctx.admin.email);
    redirect("/admin/login?step=code&e=code");
  }

  await activateSession(ctx.session.id);
  await logActivity("auth.recovery_used", ctx.admin.email);
  redirect("/admin");
}

/* ------------------------------- enrôlement du 2ᵉ facteur ------------------------------- */

export type SetupState = { error?: string; codes?: string[]; secret?: string };

export async function prepareSetup(): Promise<void> {
  const ctx = await currentPendingSession();
  if (!ctx) redirect("/admin/login?e=expired");
  if (ctx.admin.totp_enabled) redirect("/admin");
  if (!ctx.admin.totp_secret_enc) {
    const secret = generateTotpSecret();
    await query(`update admin set totp_secret_enc = $1, updated_at = now() where id = $2`, [encryptSecret(secret), ctx.admin.id]);
    await logActivity("auth.totp_setup_started", ctx.admin.email);
  }
  redirect("/admin/login?step=setup");
}

export async function confirmSetup(_prev: SetupState, formData: FormData): Promise<SetupState> {
  const ctx = await currentPendingSession();
  if (!ctx) return { error: "Session expirée. Recommence la connexion." };

  const admin = await findAdminById(ctx.admin.id);
  if (!admin?.totp_secret_enc) return { error: "Aucun secret en attente. Recharge la page." };
  if (admin.totp_enabled) return { error: "Le second facteur est déjà activé." };

  const secret = decryptSecret(admin.totp_secret_enc);
  const result = verifyTotp(secret, String(formData.get("code") ?? ""), Number(admin.totp_last_step));
  if (!result.ok) return { error: "Code refusé. Vérifie l'heure de ton téléphone et réessaie." };

  await query(`update admin set totp_enabled = true, totp_last_step = $1, updated_at = now() where id = $2`, [String(result.step), admin.id]);
  await query(`delete from recovery_codes where admin_id = $1 and used_at is null`, [admin.id]);

  const codes = generateRecoveryCodes(10);
  for (const code of codes) {
    await query(`insert into recovery_codes (admin_id, code_hash, created_at) values ($1, $2, now())`, [admin.id, hashRecoveryCode(code)]);
  }

  await logActivity("auth.totp_enabled", admin.email, { recoveryCodes: codes.length });
  return { codes };
}

export async function finishSetup(): Promise<void> {
  const ctx = await currentPendingSession();
  if (!ctx) redirect("/admin/login?e=expired");
  const admin = await findAdminById(ctx.admin.id);
  if (!admin?.totp_enabled) redirect("/admin/login?step=setup");
  await activateSession(ctx.session.id);
  await logActivity("auth.login", admin.email);
  redirect("/admin");
}

export async function secretForSetup(): Promise<{ secret: string; uri: string } | null> {
  const ctx = await currentPendingSession();
  if (!ctx || ctx.admin.totp_enabled) return null;

  let enc = ctx.admin.totp_secret_enc;
  if (!enc) {
    // Création atomique : deux rendus simultanés ne peuvent pas produire deux secrets différents.
    const candidate = encryptSecret(generateTotpSecret());
    const created = await query<{ id: string }>(
      `update admin set totp_secret_enc = $1, updated_at = now()
        where id = $2 and totp_secret_enc is null
        returning id`,
      [candidate, ctx.admin.id],
    );
    if (created.length > 0) {
      enc = candidate;
      await logActivity("auth.totp_setup_started", ctx.admin.email);
    } else {
      const fresh = await findAdminById(ctx.admin.id);
      if (!fresh?.totp_secret_enc) return null;
      enc = fresh.totp_secret_enc;
    }
  }

  const secret = decryptSecret(enc);
  return { secret, uri: otpauthUrl(secret, ctx.admin.email) };
}

/** Enveloppe : la base peut hoqueter sans casser la page ; les redirections restent hors du try/catch. */
export async function loginWithPassword(formData: FormData): Promise<void> {
  let outcome: LoginOutcome;
  try {
    outcome = await performLogin(formData);
  } catch (error) {
    const detail = {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string })?.code ?? null,
      digest: (error as { digest?: string })?.digest ?? null,
    };
    console.error("[auth] connexion impossible :", JSON.stringify(detail));
    outcome = { error: "db" };
  }
  redirect(outcome.error ? `/admin/login?e=${outcome.error}` : (outcome.next ?? "/admin"));
}
