import type { Metadata } from "next";
import { SkillsView } from "@/views/skills";
import { seoDescriptions } from "@/content/copy";
import { pageMetadata } from "@/lib/seo";
import { getSkillsForPublic } from "@/lib/cms/skills";
import { getCertificationsForPublic } from "@/lib/cms/certifications";

export const metadata: Metadata = pageMetadata({ title: "Compétences", description: seoDescriptions.skills, path: "/skills" });
// ISR : une publication faite dans l'ADMIN apparaît en moins d'une minute, sans redéploiement.
export const revalidate = 60;

export default async function Page() {
  const [items, credentials] = await Promise.all([getSkillsForPublic(), getCertificationsForPublic()]);
  return <SkillsView items={items} credentials={credentials} />;
}
