import "server-only";
import { publishedDocuments } from "./documents";
import { labEntries as staticEntries, type LabEntry } from "@/content/lab";

/**
 * Lecture publique du Lab : la base fait foi, `src/content/lab.ts` sert de repli.
 * Une base vide ou injoignable ne doit JAMAIS vider la page — c'est la garantie du repli.
 */
const toEntry = (slug: string, data: Record<string, unknown>): LabEntry => ({
  ...(data as Omit<LabEntry, "id">),
  id: slug,
});

export async function getLabForPublic(): Promise<LabEntry[]> {
  try {
    const rows = await publishedDocuments("lab_entry");
    if (rows.length === 0) return staticEntries;
    return rows.map((row) => toEntry(row.slug, row.version.data));
  } catch (error) {
    console.error("[cms] lecture du lab impossible, repli sur les fichiers :", error instanceof Error ? error.message : error);
    return staticEntries;
  }
}
