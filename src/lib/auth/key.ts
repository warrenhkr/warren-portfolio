import { createHash } from "node:crypto";

/**
 * Clé d'identification des tentatives (module pur, testable sans base).
 * Portée + empreinte de l'identifiant : aucune adresse e-mail en clair dans la table.
 */
export function attemptKey(scope: string, identifier: string): string {
  const digest = createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex").slice(0, 32);
  return `${scope}:${digest}`;
}
