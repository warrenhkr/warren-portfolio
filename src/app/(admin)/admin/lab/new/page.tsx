import { PageHeader } from "@/components/admin/ui";
import { LabForm } from "@/components/admin/LabForm";

export const dynamic = "force-dynamic";

export default function NewLabEntry({ searchParams }: { searchParams: { e?: string } }) {
  const feedback = searchParams.e
    ? {
        kind: "error" as const,
        text:
          searchParams.e === "slug"
            ? "Identifiant invalide : lettres minuscules, chiffres, tirets et soulignés."
            : searchParams.e,
      }
    : null;

  return (
    <>
      <PageHeader
        title="Nouvelle entrée du Lab"
        description="Enregistrez d'abord en brouillon, puis publiez quand l'entrée est prête."
      />
      <LabForm doc={null} mode="new" feedback={feedback} />
    </>
  );
}
