import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hachage de mot de passe sans dépendance externe : scrypt (node:crypto).
 * Format stocké : scrypt$<sel base64url>$<empreinte base64url>
 * À générer avec `npm run admin:hash`.
 */
const KEYLEN = 64;
const PARAMS = { N: 16384, r: 8, p: 1 } as const;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, KEYLEN, PARAMS);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  try {
    const [scheme, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    if (expected.length === 0) return false;
    const actual = scryptSync(password.normalize("NFKC"), salt, expected.length, PARAMS);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
