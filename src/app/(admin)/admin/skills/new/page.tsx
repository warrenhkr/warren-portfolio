import { PageHeader } from "@/components/admin/ui";
import { SkillForm } from "@/components/admin/SkillForm";

export const dynamic = "force-dynamic";

export default function NewSkill({ searchParams }: { searchParams: { e?: string } }) {
  const feedback = searchParams.e
    ? { kind: "error" as const, text: searchParams.e === "slug" ? "Identifiant invalide : lettres minuscules, chiffres, tirets." : searchParams.e }
    : null;

  return (
    <>
      <PageHeader
        title="Nouvelle compétence"
        description="Enregistrez d'abord en brouillon, puis publiez quand la fiche est prête."
      />
      <SkillForm doc={null} mode="new" feedback={feedback} />
    </>
  );
}
