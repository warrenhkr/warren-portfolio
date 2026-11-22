import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import {
  base32Encode,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  hotp,
  normalizeRecoveryCode,
  totpStep,
  verifyTotp,
} from "../src/lib/auth/totp";
import { attemptKey } from "../src/lib/auth/key";

// Clé de test : 32 octets fixes, jamais utilisée ailleurs qu'ici.
process.env.ADMIN_TOTP_KEY = Buffer.alloc(32, 7).toString("base64");

/** Vecteurs officiels RFC 6238 (graine ASCII « 12345678901234567890 »), tronqués à 6 chiffres. */
describe("TOTP", () => {
  const secret = base32Encode(Buffer.from("12345678901234567890", "ascii"));

  it("code conforme au RFC 6238", () => {
    assert.equal(hotp(secret, 1), "287082"); // T = 59 s
    assert.equal(hotp(secret, 37037036), "081804"); // T = 1111111109 s
  });

  it("fenêtre courante = floor(temps / 30)", () => {
    assert.equal(totpStep(59_000), 1);
    assert.equal(totpStep(89_999), 2);
  });

  it("accepte ±1 fenêtre et refuse le rejeu", () => {
    const now = 1_700_000_000_000;
    const step = totpStep(now);
    const code = hotp(secret, step);

    assert.equal(verifyTotp(secret, code, 0, 1, now).ok, true);
    assert.equal(verifyTotp(secret, code, step, 1, now).ok, false, "même fenêtre déjà consommée → refusé");
    assert.equal(verifyTotp(secret, hotp(secret, step - 1), 0, 1, now).ok, true, "fenêtre précédente tolérée");
    assert.equal(verifyTotp(secret, hotp(secret, step + 3), 0, 1, now).ok, false, "trop loin dans le futur");
    assert.equal(verifyTotp(secret, "12345", 0, 1, now).ok, false, "longueur invalide");
  });

  it("secret chiffré : aller-retour et refus d'un contenu altéré", () => {
    const enc = encryptSecret(secret);
    assert.equal(decryptSecret(enc), secret);
    assert.ok(!enc.includes(secret), "le secret ne doit pas apparaître en clair");
    const [version, iv, tag, ct] = enc.split(".");
    const tampered = `${version}.${iv}.${tag}.${ct.slice(0, -2)}${ct.endsWith("AA") ? "BB" : "AA"}`;
    assert.throws(() => decryptSecret(tampered));
  });
});

describe("codes de secours", () => {
  it("10 codes uniques, format lisible, hash stable", () => {
    const codes = generateRecoveryCodes(10);
    assert.equal(codes.length, 10);
    assert.equal(new Set(codes).size, 10);
    for (const code of codes) assert.match(code, /^[A-Z2-7]{5}-[A-Z2-7]{5}$/);
    const hash = hashRecoveryCode(codes[0]);
    assert.equal(hash, hashRecoveryCode(codes[0].toLowerCase().replace("-", " ")));
    assert.equal(normalizeRecoveryCode(codes[0]).length, 10);
    assert.equal(hash.length, 64);
  });
});

describe("mot de passe", () => {
  it("hash scrypt vérifié, mauvais mot de passe refusé", () => {
    const hash = hashPassword("correct horse battery staple");
    assert.match(hash, /^scrypt\$/);
    assert.equal(verifyPassword("correct horse battery staple", hash), true);
    assert.equal(verifyPassword("mauvais", hash), false);
    assert.equal(verifyPassword("correct horse battery staple", undefined), false);
    assert.equal(verifyPassword("correct horse battery staple", "bcrypt$nope"), false);
  });
});

describe("limitation des tentatives", () => {
  it("clé stable, insensible à la casse et aux espaces, sans identifiant en clair", () => {
    const a = attemptKey("login", "  Warren@Example.COM ");
    const b = attemptKey("login", "warren@example.com");
    assert.equal(a, b);
    assert.ok(!a.includes("warren"), "l'e-mail ne doit pas apparaître dans la clé");
    assert.equal(a.length, "login:".length + 32);
    assert.notEqual(attemptKey("totp", "warren@example.com"), a);
    assert.equal(createHash("sha256").update("x").digest("hex").length, 64);
  });
});
