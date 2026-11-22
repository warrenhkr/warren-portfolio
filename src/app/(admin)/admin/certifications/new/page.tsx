import { PageHeader } from "@/components/admin/ui";
import { CertificationForm } from "@/components/admin/CertificationForm";

export const dynamic = "force-dynamic";

export default function NewCertification({ searchParams }: { searchParams: { e?: string } }) {
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
        title="Nouvelle certification"
        description="Enregistrez d'abord en brouillon, puis publiez quand l'intitulé réel est confirmé."
      />
      <CertificationForm doc={null} mode="new" feedback={feedback} />
    </>
  );
}
