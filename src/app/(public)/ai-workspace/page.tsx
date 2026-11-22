import type { Metadata } from "next";
import { AiView } from "@/views/ai";
import { seoDescriptions } from "@/content/copy";
import { pageMetadata } from "@/lib/seo";
import { getAiToolsForPublic } from "@/lib/cms/ai";

export const metadata: Metadata = pageMetadata({ title: "Espace IA", description: seoDescriptions.ai, path: "/ai-workspace" });
// ISR : une publication faite dans l'ADMIN apparaît en moins d'une minute, sans redéploiement.
export const revalidate = 60;

export default async function Page() {
  const items = await getAiToolsForPublic();
  return <AiView items={items} />;
}
