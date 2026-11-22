import "server-only";

/**
 * Garde d'accès à l'ADMIN — point d'entrée historique, désormais branché sur la vraie autorisation.
 * L'implémentation vit dans ./require : session en base, `stage = 'totp'` obligatoire (mot de passe + 2ᵉ facteur).
 * À appeler dans le layout, chaque page, chaque Server Action et chaque route API de l'ADMIN.
 */
export { assertAdmin, currentPendingSession, getCurrentAdmin, requireAdmin } from "./require";
export type { AdminUser } from "./require";
