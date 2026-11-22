import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects as staticProjects } from "@/content/projects";
import { ProjectDetailView } from "@/views/projects";
import { pageMetadata } from "@/lib/seo";
import { getProjectForPublic } from "@/lib/cms/public";

// Les fiches viennent de la base : une nouvelle fiche ne doit pas exiger un redéploiement.
export const dynamicParams = true;
export const revalidate = 60;

export function generateStaticParams() {
  return staticProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProjectForPublic(params.slug);
  if (!p) return {};
  const description = p.summary?.fr ?? `Projet ${p.category === "hardware" ? "Hardware" : "Software"} de Warren Hounkanrin.`;
  return pageMetadata({ title: p.title.fr, description, path: `/projects/${p.slug}` });
}

export default async function Page({ params }: { params: { slug: string } }) {
  const project = await getProjectForPublic(params.slug);
  if (!project) notFound();
  return <ProjectDetailView slug={params.slug} project={project} />;
}
