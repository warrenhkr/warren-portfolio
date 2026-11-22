import { notFound } from "next/navigation";
import { getDocument } from "@/lib/cms/documents";
import { PageHeader } from "@/components/admin/ui";
import { AiToolForm } from "@/components/admin/AiToolForm";

export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  publie: "Publié : la modification est visible sur /ai-workspace.",
  enregistre: "Brouillon enregistré. Il reste invisible sur le site jusqu'à publication.",
};

export default async function EditAiTool({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ok?: string; e?: string };
}) {
  const doc = await getDocument("ai_tool", params.slug);
  if (!doc) notFound();

  const feedback = searchParams.ok
    ? { kind: "ok" as const, text: OK[searchParams.ok] ?? "Enregistré." }
    : searchParams.e
      ? { kind: "error" as const, text: searchParams.e }
      : null;

  const title = (String(doc.draft.data.name ?? "") || doc.slug);

  return (
    <>
      <PageHeader title={title} description={`Outil IA · ${doc.slug}`} />
      <AiToolForm doc={doc} mode="edit" feedback={feedback} />
    </>
  );
}
