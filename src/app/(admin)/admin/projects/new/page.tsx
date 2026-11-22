import { PageHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default function NewProjectPage({ searchParams }: { searchParams: { e?: string } }) {
  const feedback = searchParams.e
    ? { kind: "error" as const, text: searchParams.e === "slug" ? "Identifiant invalide : lettres minuscules, chiffres, tirets." : searchParams.e }
    : null;

  return (
    <>
      <PageHeader
        title="Nouveau projet"
        description="Enregistrez d'abord en brouillon, puis publiez quand la fiche est prête."
      />
      <ProjectForm doc={null} mode="new" feedback={feedback} />
    </>
  );
}
