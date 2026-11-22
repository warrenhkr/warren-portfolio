import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * TOTP (RFC 6238) et codes de secours, sans dépendance externe.
 * - Secret : 20 octets aléatoires encodés en base32 (format standard des applications d'authentification).
 * - Chiffrement du secret en base : AES-256-GCM avec ADMIN_TOTP_KEY (32 octets, base64, .env.local).
 * - Rejeu bloqué : la colonne admin.totp_last_step mémorise la dernière fenêtre consommée.
 */
const DIGITS = 6;
export const STEP_SECONDS = 30;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export const generateTotpSecret = (bytes = 20): string => base32Encode(randomBytes(bytes));

export const totpStep = (atMs: number = Date.now()): number => Math.floor(atMs / 1000 / STEP_SECONDS);

/** Code TOTP pour un compteur donné (RFC 4226 puis 6238). */
export function hotp(secretB32: string, counter: number): string {
  const key = base32Decode(secretB32);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter % 2 ** 32, 4);
  const digest = createHmac("sha1", key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const bin =
    ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(bin % 10 ** DIGITS).padStart(DIGITS, "0");
}

export const totpCode = (secretB32: string, atMs: number = Date.now()): string => hotp(secretB32, totpStep(atMs));

/**
 * Vérifie un code avec une tolérance de ±1 fenêtre (dérive d'horloge).
 * Refuse toute fenêtre déjà consommée (lastStep) pour empêcher le rejeu.
 */
export function verifyTotp(secretB32: string, code: string, lastStep = 0, window = 1, atMs: number = Date.now()): { ok: boolean; step: number } {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== DIGITS) return { ok: false, step: 0 };
  const current = totpStep(atMs);
  for (let delta = -window; delta <= window; delta += 1) {
    const step = current + delta;
    if (step <= lastStep) continue; // déjà utilisé
    const expected = hotp(secretB32, step);
    const a = Buffer.from(expected);
    const b = Buffer.from(digits);
    if (a.length === b.length && timingSafeEqual(a, b)) return { ok: true, step };
  }
  return { ok: false, step: 0 };
}

export function otpauthUrl(secretB32: string, email: string, issuer = "WARREN HOUNKANRIN"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({ secret: secretB32, issuer, algorithm: "SHA1", digits: String(DIGITS), period: String(STEP_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/* ---------- chiffrement du secret ---------- */

export const isTotpKeyConfigured = (): boolean => {
  const raw = process.env.ADMIN_TOTP_KEY;
  if (!raw) return false;
  try {
    return Buffer.from(raw, "base64").length === 32;
  } catch {
    return false;
  }
};

function totpKey(): Buffer {
  const raw = process.env.ADMIN_TOTP_KEY;
  if (!raw) throw new Error("ADMIN_TOTP_KEY n'est pas défini (32 octets en base64).");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ADMIN_TOTP_KEY doit faire 32 octets encodés en base64.");
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", totpKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ct.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, ctB64] = payload.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !ctB64) throw new Error("Secret TOTP illisible (format inattendu).");
  const decipher = createDecipheriv("aes-256-gcm", totpKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString("utf8");
}

/* ---------- codes de secours ---------- */

export const formatRecoveryCode = (code: string): string => `${code.slice(0, 5)}-${code.slice(5)}`;

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) codes.push(formatRecoveryCode(base32Encode(randomBytes(7)).slice(0, 10)));
  return codes;
}

export const normalizeRecoveryCode = (code: string): string => code.toUpperCase().replace(/[^A-Z2-7]/g, "");

export const hashRecoveryCode = (code: string): string => createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
