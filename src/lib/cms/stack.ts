import "server-only";
import { publishedDocuments } from "./documents";
import { stack as staticStack, type Tech } from "@/content/stack";

/**
 * Lecture publique de la stack : la base fait foi, `src/content/stack.ts` sert de repli.
 * Une base vide ou injoignable ne doit JAMAIS vider la page.
 */
const toTech = (slug: string, data: Record<string, unknown>): Tech => ({
  ...(data as Omit<Tech, "id">),
  id: slug,
});

export async function getStackForPublic(): Promise<Tech[]> {
  try {
    const rows = await publishedDocuments("tech");
    if (rows.length === 0) return staticStack;
    return rows.map((r) => toTech(r.slug, r.version.data));
  } catch (error) {
    console.error(
      "[cms] lecture de la stack impossible, repli sur les fichiers :",
      error instanceof Error ? error.message : error,
    );
    return staticStack;
  }
}
