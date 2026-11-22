import type { Metadata } from "next";
import { LabView } from "@/views/lab";
import { seoDescriptions } from "@/content/copy";
import { pageMetadata } from "@/lib/seo";
import { getLabForPublic } from "@/lib/cms/lab";

export const metadata: Metadata = pageMetadata({ title: "Lab", description: seoDescriptions.lab, path: "/lab" });
// ISR : une publication faite dans l'ADMIN apparaît en moins d'une minute, sans redéploiement.
export const revalidate = 60;

export default async function Page() {
  const entries = await getLabForPublic();
  return <LabView entries={entries} />;
}
