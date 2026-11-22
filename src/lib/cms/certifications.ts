import "server-only";
import { publishedDocuments } from "./documents";
import { credentials as staticCredentials, type Credential } from "@/content/skills";

/**
 * Lecture publique des certifications : la base fait foi, `src/content/skills.ts` sert de repli.
 * Aucune certification n'est inventée : une base vide laisse la rubrique masquée plutôt que
 * de remplir la page avec des diplômes qui n'existent pas.
 */
const toCredential = (slug: string, data: Record<string, unknown>): Credential => {
  const raw = data as { title?: Credential["title"]; issuer?: string; year?: string };
  return {
    id: slug,
    title: raw.title ?? { fr: "", en: "" },
    // Les champs vides deviennent `undefined` pour que l'affichage « émetteur · année » reste propre.
    issuer: raw.issuer?.trim() ? raw.issuer : undefined,
    year: raw.year?.trim() ? raw.year : undefined,
  };
};

export async function getCertificationsForPublic(): Promise<Credential[]> {
  try {
    const rows = await publishedDocuments("certification");
    if (rows.length === 0) return staticCredentials;
    return rows.map((row) => toCredential(row.slug, row.version.data));
  } catch (error) {
    console.error("[cms] lecture des certifications impossible, repli sur les fichiers :", error instanceof Error ? error.message : error);
    return staticCredentials;
  }
}
