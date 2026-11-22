import "server-only";
import { publishedDocuments } from "./documents";
import { technicalSkills as staticSkills, type Skill } from "@/content/skills";

/**
 * Lecture publique des compétences : la base fait foi, `src/content/skills.ts` sert de repli.
 * Une base vide ou injoignable ne doit JAMAIS vider la page — c'est la garantie du repli.
 */
const toSkill = (slug: string, data: Record<string, unknown>): Skill => ({
  ...(data as Omit<Skill, "id">),
  id: slug,
});

export async function getSkillsForPublic(): Promise<Skill[]> {
  try {
    const rows = await publishedDocuments("skill");
    if (rows.length === 0) return staticSkills;
    return rows.map((r) => toSkill(r.slug, r.version.data));
  } catch (error) {
    console.error(
      "[cms] lecture des compétences impossible, repli sur les fichiers :",
      error instanceof Error ? error.message : error,
    );
    return staticSkills;
  }
}
