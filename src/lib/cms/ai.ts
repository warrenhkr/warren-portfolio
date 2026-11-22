import "server-only";
import { publishedDocuments } from "./documents";
import { aiTools as staticAiTools, type AiTool } from "@/content/ai";

/**
 * Lecture publique de l'espace IA : la base fait foi, `src/content/ai.ts` sert de repli.
 * Une base vide ou injoignable ne doit JAMAIS vider la page.
 */
const toAiTool = (slug: string, data: Record<string, unknown>): AiTool => ({
  ...(data as Omit<AiTool, "id">),
  id: slug,
});

export async function getAiToolsForPublic(): Promise<AiTool[]> {
  try {
    const rows = await publishedDocuments("ai_tool");
    if (rows.length === 0) return staticAiTools;
    return rows.map((r) => toAiTool(r.slug, r.version.data));
  } catch (error) {
    console.error(
      "[cms] lecture de l'espace IA impossible, repli sur les fichiers :",
      error instanceof Error ? error.message : error,
    );
    return staticAiTools;
  }
}
