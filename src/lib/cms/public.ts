import "server-only";
import { publishedDocuments } from "./documents";
import { projects as staticProjects, type Project } from "@/content/projects";

/**
 * Lecture publique des projets : la base fait foi, les fichiers TypeScript servent de repli.
 * Une base vide ou injoignable ne doit JAMAIS vider la page — c'est la garantie du repli.
 */
const toProject = (slug: string, data: Record<string, unknown>): Project => ({ ...(data as Omit<Project, "slug">), slug });

export async function getProjectsForPublic(): Promise<Project[]> {
  try {
    const rows = await publishedDocuments("project");
    if (rows.length === 0) return staticProjects;
    return rows.map((r) => toProject(r.slug, r.version.data));
  } catch (error) {
    console.error("[cms] lecture des projets impossible, repli sur les fichiers :", error instanceof Error ? error.message : error);
    return staticProjects;
  }
}

export async function getProjectForPublic(slug: string): Promise<Project | null> {
  const all = await getProjectsForPublic();
  return all.find((p) => p.slug === slug) ?? null;
}
