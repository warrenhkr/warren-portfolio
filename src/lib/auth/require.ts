import "server-only";
import { redirect } from "next/navigation";
import { currentSession, touchSession } from "./session";

/**
 * Autorisation de l'ADMIN — source unique de vérité.
 * Une session n'est valide que si `stage = 'totp'` : le mot de passe seul ne suffit jamais.
 */
export type AdminUser = { id: string; email: string };

export class AdminAuthError extends Error {
  constructor() {
    super("ADMIN_UNAUTHORIZED");
    this.name = "AdminAuthError";
  }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const ctx = await currentSession();
    if (!ctx) return null;
    if (ctx.session.stage !== "active") return null;
    await touchSession(ctx.session).catch(() => undefined);
    return { id: ctx.admin.id, email: ctx.admin.email };
  } catch (error) {
    // Base injoignable : on n'ouvre jamais l'ADMIN, et on ne casse pas la page en 500.
    console.error("[auth] vérification de session impossible :", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Pour les pages et layouts : redirige vers la connexion. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Pour les Server Actions et les routes API : lève une erreur, c'est à l'appelant de répondre 401/403. */
export async function assertAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AdminAuthError();
  return admin;
}

/** Session en attente du 2ᵉ facteur (ou de l'enrôlement). */
export async function currentPendingSession() {
  const ctx = await currentSession();
  if (!ctx) return null;
  if (ctx.session.stage !== "pending") return null;
  return ctx;
}
