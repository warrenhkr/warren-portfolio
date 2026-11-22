import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { readActivityJournal, type ActivityRow } from "@/lib/admin/activity";

export const dynamic = "force-dynamic";

/**
 * Écran « Journal d'activité » — lecture seule.
 * Tous les gestes sensibles (connexions, publications, suppressions, réglages…) laissent une
 * ligne dans `activity`. Rien n'est modifiable ici : un journal qu'on peut réécrire ne vaut rien.
 */

const ACTION_LABELS: Record<string, string> = {
  "auth.password_ok": "Mot de passe accepté",
  "auth.login": "Connexion complète (2ᵉ facteur validé)",
  "auth.logout": "Déconnexion",
  "auth.failed": "Mot de passe refusé",
  "auth.totp_failed": "Code à 6 chiffres refusé",
  "auth.recovery_failed": "Code de secours refusé",
  "auth.recovery_used": "Connexion par code de secours",
  "auth.rate_limited": "Tentatives bloquées (limite atteinte)",
  "auth.totp_setup_started": "Enrôlement du 2ᵉ facteur démarré",
  "auth.totp_enabled": "Second facteur activé",
  "document.save": "Enregistré (brouillon)",
  "document.publish": "Publié",
  "document.unpublish": "Dépublié",
  "document.delete": "Supprimé",
  "settings.save": "Réglages enregistrés",
  "settings.publish": "Réglages publiés",
  "nav.save": "Lien de menu enregistré",
  "nav.publish": "Lien de menu publié",
  "nav.create": "Lien de menu ajouté",
  "nav.delete": "Lien de menu supprimé",
  "nav.move": "Ordre du menu modifié",
  "social.save": "Réseau enregistré",
  "social.publish": "Réseau publié",
  "social.create": "Réseau ajouté",
  "social.delete": "Réseau supprimé",
  "social.move": "Ordre des réseaux modifié",
  "message.read": "Message lu",
  "message.delete": "Message supprimé",
};

/** Les actions d'authentification méritent un coup d'œil : elles sont colorées différemment. */
const isAuth = (action: string) => action.startsWith("auth.") || action.startsWith("security.");

const TONE: Record<string, "published" | "draft" | "scheduled" | "warn" | "neutral"> = {
  "auth.login": "published",
  "auth.failed": "warn",
  "auth.totp_failed": "warn",
  "auth.recovery_failed": "warn",
  "auth.rate_limited": "warn",
  "auth.recovery_used": "scheduled",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function when(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "date inconnue" : dateFormat.format(date);
}

/** Résumé lisible des détails, sans dépendre du client. */
function detailsText(details: ActivityRow["details"]): string {
  if (!details) return "";
  const entries = Object.entries(details).filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (entries.length === 0) return "";
  return entries.map(([key, value]) => `${key} : ${typeof value === "object" ? JSON.stringify(value) : String(value)}`).join(" · ");
}

export default async function ActivityPage({ searchParams }: { searchParams: { action?: string } }) {
  const journal = await readActivityJournal(120);
  const filter = searchParams.action?.trim() || null;
  const visible = filter ? journal.entries.filter((entry) => entry.action === filter) : journal.entries;

  return (
    <>
      <PageHeader
        title="Journal d'activité"
        description="Tout ce qui touche au site et à la sécurité laisse une trace ici. Écran de lecture seule : aucune ligne ne peut être modifiée ni effacée depuis l'ADMIN."
        meta={
          <>
            <Badge tone="neutral">{journal.total} entrée{journal.total > 1 ? "s" : ""}</Badge>
            <Badge tone={journal.last24h > 0 ? "published" : "neutral"}>{journal.last24h} sur 24 h</Badge>
            {filter ? <Badge tone="scheduled">filtré : {ACTION_LABELS[filter] ?? filter}</Badge> : null}
          </>
        }
      />

      <div className="space-y-6">
        <Panel
          title="Répartition par action"
          description="Un clic filtre la liste ci-dessous. Les actions de sécurité sont signalées à part."
        >
          {journal.groups.length === 0 ? (
            <p className="text-sm text-muted">Aucune activité enregistrée pour l&apos;instant.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {journal.groups.map((group) => {
                const active = filter === group.action;
                return (
                  <li key={group.action}>
                    <a
                      href={active ? "/admin/activity" : `/admin/activity?action=${encodeURIComponent(group.action)}`}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-[rgb(var(--accent))]/60 bg-[rgb(var(--accent))]/10 text-fg"
                          : "border-line text-muted hover:bg-surface2 hover:text-fg"
                      }`}
                    >
                      <span className={isAuth(group.action) ? "text-fg" : ""}>{ACTION_LABELS[group.action] ?? group.action}</span>
                      <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[10px] tabular-nums">{group.total}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title={filter ? "Entrées filtrées" : "Dernières entrées"}
          description={`120 lignes au maximum, de la plus récente à la plus ancienne.`}
        >
          {visible.length === 0 ? (
            <p className="text-sm text-muted">Rien à afficher.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Journal d&apos;activité</caption>
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Quand</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Action</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Objet</th>
                    <th scope="col" className="py-2.5 font-semibold">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((entry) => (
                    <tr key={entry.id} className="border-b border-line/60 align-top last:border-0">
                      <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-[11px] tabular-nums text-muted">{when(entry.at)}</td>
                      <td className="py-2.5 pr-4">
                        <Badge tone={TONE[entry.action] ?? "neutral"}>{ACTION_LABELS[entry.action] ?? entry.action}</Badge>
                        {!ACTION_LABELS[entry.action] ? (
                          <span className="mt-1 block font-mono text-[10px] text-muted">{entry.action}</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-4 text-fg">{entry.label ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2.5 font-mono text-[11px] leading-relaxed text-muted">
                        {detailsText(entry.details) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
