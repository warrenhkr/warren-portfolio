import { PageHeader, Badge } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { readSeoPages, readSiteSettings, SEO_ROUTES } from "@/lib/cms/settings";

export const dynamic = "force-dynamic";

/**
 * Écran « SEO et réglages ».
 * Lecture seule au chargement ; toute écriture passe par les actions du dossier `settings/`
 * (validation Zod + trace dans `activity`).
 */

/** Les actions renvoient des codes dans `?ok=` : on les traduit ici, en français lisible. */
function feedbackOf(searchParams: { ok?: string; e?: string }) {
  if (searchParams.e) return { kind: "error" as const, text: searchParams.e };
  if (!searchParams.ok) return null;

  const code = searchParams.ok;
  if (code === "site-publie") return { kind: "ok" as const, text: "Réglages du site enregistrés et publiés." };
  if (code === "site-enregistre") return { kind: "ok" as const, text: "Réglages du site enregistrés en brouillon." };

  // Codes SEO : « <slug>-publie » / « <slug>-enregistre ».
  const match = /^(.+)-(publie|enregistre)$/.exec(code);
  if (match) {
    const label = SEO_ROUTES.find((route) => route.slug === match[1])?.label ?? match[1];
    return {
      kind: "ok" as const,
      text:
        match[2] === "publie"
          ? `SEO de la page « ${label} » enregistré et publié.`
          : `SEO de la page « ${label} » enregistré en brouillon.`,
    };
  }

  return { kind: "ok" as const, text: "Action effectuée." };
}

export default async function SettingsPage({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const [site, seo] = await Promise.all([readSiteSettings(), readSeoPages()]);

  return (
    <>
      <PageHeader
        title="SEO et réglages"
        description="Identité du site et métadonnées des pages publiques. Les modifications en brouillon ne changent rien sur le site tant qu'elles ne sont pas publiées."
        meta={
          <>
            <Badge tone={site.source === "base" ? "neutral" : "warn"}>
              {site.source === "base" ? "Réglages en base" : "Réglages depuis les fichiers"}
            </Badge>
            <Badge tone={seo.source === "base" ? "neutral" : "warn"}>
              {seo.source === "base" ? "SEO en base" : "SEO depuis les fichiers"}
            </Badge>
          </>
        }
      />

      <SettingsForm site={site} seo={seo} feedback={feedbackOf(searchParams)} />
    </>
  );
}
