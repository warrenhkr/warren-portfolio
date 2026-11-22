import { notFound } from "next/navigation";
import { getDocument } from "@/lib/cms/documents";
import { PageHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  publie: "Projet publié : il est visible sur le site public.",
  enregistre: "Brouillon enregistré. Il reste invisible sur le site jusqu'à publication.",
};

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ok?: string; e?: string };
}) {
  const doc = await getDocument("project", params.slug);
  if (!doc) notFound();

  const feedback = searchParams.ok
    ? { kind: "ok" as const, text: OK[searchParams.ok] ?? "Enregistré." }
    : searchParams.e
      ? { kind: "error" as const, text: searchParams.e }
      : null;

  return (
    <>
      <PageHeader
        title={(doc.draft.data.title as { fr?: string } | undefined)?.fr || doc.slug}
        description={`Fiche projet · /projects/${doc.slug}`}
      />
      <ProjectForm doc={doc} mode="edit" feedback={feedback} />
    </>
  );
}
