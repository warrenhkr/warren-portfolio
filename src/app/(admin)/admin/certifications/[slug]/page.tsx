import { notFound } from "next/navigation";
import { getDocument } from "@/lib/cms/documents";
import { PageHeader } from "@/components/admin/ui";
import { CertificationForm } from "@/components/admin/CertificationForm";

export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  publie: "Publié : la certification est visible sur /skills.",
  enregistre: "Brouillon enregistré. Il reste invisible sur le site jusqu'à publication.",
};

export default async function EditCertification({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ok?: string; e?: string };
}) {
  const doc = await getDocument("certification", params.slug);
  if (!doc) notFound();

  const feedback = searchParams.ok
    ? { kind: "ok" as const, text: OK[searchParams.ok] ?? "Enregistré." }
    : searchParams.e
      ? { kind: "error" as const, text: searchParams.e }
      : null;

  const title = (doc.draft.data.title as { fr?: string } | undefined)?.fr || doc.slug;

  return (
    <>
      <PageHeader title={title} description={`Certification · ${doc.slug}`} />
      <CertificationForm doc={doc} mode="edit" feedback={feedback} />
    </>
  );
}
