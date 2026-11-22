import type { Metadata } from "next";
import { StackView } from "@/views/stack";
import { seoDescriptions } from "@/content/copy";
import { pageMetadata } from "@/lib/seo";
import { getStackForPublic } from "@/lib/cms/stack";

export const metadata: Metadata = pageMetadata({ title: "Ma stack", description: seoDescriptions.stack, path: "/stack" });
// ISR : une publication faite dans l'ADMIN apparaît en moins d'une minute, sans redéploiement.
export const revalidate = 60;

export default async function Page() {
  const items = await getStackForPublic();
  return <StackView items={items} />;
}
