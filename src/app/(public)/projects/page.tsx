import type { Metadata } from "next";
import { ProjectsView } from "@/views/projects";
import { seoDescriptions } from "@/content/copy";
import { pageMetadata } from "@/lib/seo";
import { getProjectsForPublic } from "@/lib/cms/public";

export const metadata: Metadata = pageMetadata({ title: "Projets", description: seoDescriptions.projects, path: "/projects" });
// ISR : une publication faite dans l'ADMIN apparaît en moins d'une minute, sans redéploiement.
export const revalidate = 60;

export default async function Page() {
  const items = await getProjectsForPublic();
  return <ProjectsView items={items} />;
}
