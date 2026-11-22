import { PageHeader } from "@/components/admin/ui";
import { AiToolForm } from "@/components/admin/AiToolForm";

export const dynamic = "force-dynamic";

export default function NewAiTool({ searchParams }: { searchParams: { e?: string } }) {
  const feedback = searchParams.e
    ? { kind: "error" as const, text: searchParams.e === "slug" ? "Identifiant invalide : lettres minuscules, chiffres, tirets." : searchParams.e }
    : null;

  return (
    <>
      <PageHeader
        title="Nouvel outil IA"
        description="Enregistrez d'abord en brouillon, puis publiez quand la fiche est prête."
      />
      <AiToolForm doc={null} mode="new" feedback={feedback} />
    </>
  );
}
