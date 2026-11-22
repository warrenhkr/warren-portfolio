import fs from "fs";

/**
 * Normalise les URL de connexion dans .env.local :
 * - retire les apostrophes/guillemets ajoutés par erreur ;
 * - encode le « $ » du mot de passe en %24 (Next/dotenv-expand interprète sinon « $xxx »
 *   comme une variable et tronque la valeur au chargement — cause du 28P01).
 * Aucun secret n'est affiché.
 */
const p = ".env.local";
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
let touched = 0;
const out = lines.map((l) => {
  const m = l.match(/^(DATABASE_URL|DATABASE_URL_DIRECT)=(.*)$/);
  if (!m) return l;
  let v = m[2].trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
  const parts = v.match(/^([a-z]+:\/\/[^:/]+:)([^@]*)@(.+)$/i);
  if (!parts) {
    console.log(`${m[1]} : format inattendu, non modifié`);
    return `${m[1]}=${v}`;
  }
  const before = parts[2];
  const after = before.replace(/\$/g, "%24");
  if (after !== before) touched += 1;
  return `${m[1]}=${parts[1]}${after}@${parts[3]}`;
});
fs.writeFileSync(p, out.join("\n"));
console.log(`${touched} URL normalisée(s) : $ encodé en %24`);
