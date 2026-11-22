import { PageHeader } from "@/components/admin/ui";
import { StackForm } from "@/components/admin/StackForm";

export const dynamic = "force-dynamic";

export default function NewTech({ searchParams }: { searchParams: { e?: string } }) {
  const feedback = searchParams.e
    ? { kind: "error" as const, text: searchParams.e === "slug" ? "Identifiant invalide : lettres minuscules, chiffres, tirets." : searchParams.e }
    : null;

  return (
    <>
      <PageHeader
        title="Nouvelle technologie"
        description="Enregistrez d'abord en brouillon, puis publiez quand la fiche est prête."
      />
      <StackForm doc={null} mode="new" feedback={feedback} />
    </>
  );
}
