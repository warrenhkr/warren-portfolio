import { Badge, PageHeader, Panel, StatusDot } from "@/components/admin/ui";
import { readSecurityState } from "@/lib/admin/security";

export const dynamic = "force-dynamic";

/**
 * Écran « Sécurité » — lecture seule.
 * Aucune action destructrice n'est proposée ici (réinitialiser un mot de passe ou révoquer
 * toutes les sessions se fait en ligne de commande, volontairement : ce n'est pas un clic distrait).
 */

const EVENT_LABELS: Record<string, string> = {
  "auth.password_ok": "Mot de passe accepté",
  "auth.login": "Connexion complète",
  "auth.failed": "Mot de passe refusé",
  "auth.totp_failed": "Code à 6 chiffres refusé",
  "auth.recovery_failed": "Code de secours refusé",
  "auth.recovery_used": "Connexion par code de secours",
  "auth.rate_limited": "Tentatives bloquées",
  "auth.totp_enabled": "Second facteur activé",
  "auth.totp_setup_started": "Enrôlement du second facteur démarré",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function when(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "date inconnue" : dateFormat.format(date);
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface2/40 px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm text-fg">{children}</dd>
    </div>
  );
}

export default async function SecurityPage() {
  const state = await readSecurityState();

  if (!state) {
    return (
      <>
        <PageHeader title="Sécurité" description="État du compte administrateur." />
        <Panel>
          <p className="text-sm text-muted">
            Aucun compte administrateur en base. Créez-le avec <code className="font-mono">npm run admin:init</code>.
          </p>
        </Panel>
      </>
    );
  }

  const codesLow = state.recovery.remaining <= 2;

  return (
    <>
      <PageHeader
        title="Sécurité"
        description="État réel du compte et de la connexion, lu dans PostgreSQL. Cet écran n'affiche et ne modifie aucun secret."
        meta={
          <>
            <Badge tone={state.account.totpEnabled ? "published" : "warn"}>
              {state.account.totpEnabled ? "Second facteur actif" : "Second facteur inactif"}
            </Badge>
            <Badge tone={codesLow ? "warn" : "neutral"}>
              {state.recovery.remaining} code{state.recovery.remaining > 1 ? "s" : ""} de secours
            </Badge>
            <Badge tone="neutral">
              {state.sessions.active} session{state.sessions.active > 1 ? "s" : ""} active{state.sessions.active > 1 ? "s" : ""}
            </Badge>
          </>
        }
      />

      <div className="space-y-6">
        {!state.account.totpEnabled && (
          <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <StatusDot tone="warn" /> Le second facteur n&apos;est pas activé : la connexion ne demande que le mot de passe.
            Il sera activé à la prochaine connexion.
          </p>
        )}

        <Panel title="Compte administrateur" description="Un seul compte existe (contrainte de base) : c'est celui-ci.">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Adresse">
              <span className="font-mono text-[13px]">{state.account.email}</span>
            </Fact>
            <Fact label="Second facteur (TOTP)">
              {state.account.totpEnabled ? (
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone="ok" /> Activé — un code à 6 chiffres est exigé à chaque connexion
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone="warn" /> Inactif
                </span>
              )}
            </Fact>
            <Fact label="Compte créé le">{when(state.account.createdAt)}</Fact>
            <Fact label="Dernière modification du compte">{when(state.account.updatedAt)}</Fact>
            <Fact label="Clé de chiffrement TOTP">
              {state.keysConfigured.totpKey ? (
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone="ok" /> Présente et valide (32 octets)
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone="error" /> Absente ou invalide — le code ne peut pas être vérifié
                </span>
              )}
            </Fact>
          </dl>
        </Panel>

        <Panel
          title="Codes de secours"
          description="À usage unique, pour entrer quand le téléphone est indisponible."
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Codes restants">
              <span className={codesLow ? "text-amber-300" : ""}>
                {state.recovery.remaining} sur {state.recovery.total}
              </span>
            </Fact>
            <Fact label="Dernière utilisation">
              {state.recovery.total - state.recovery.remaining === 0
                ? "Aucun code consommé"
                : `${state.recovery.total - state.recovery.remaining} code(s) utilisé(s)`}
            </Fact>
          </dl>
          {codesLow && (
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              Il en reste peu : régénère-les en réinitialisant le compte avec{" "}
              <code className="font-mono">npm run admin:reset</code>, puis ré-enrôle le second facteur à la connexion suivante.
            </p>
          )}
        </Panel>

        <Panel title="Sessions ouvertes" description="Chaque connexion complète crée une session de 7 jours glissants.">
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Fact label="Sessions actives">{state.sessions.active}</Fact>
            <Fact label="Prochaine expiration">{when(state.sessions.oldestExpiry)}</Fact>
            <Fact label="Dernière activité">{when(state.sessions.newestSeen)}</Fact>
            <Fact label="Sessions expirées non purgées">
              {state.sessions.expired > 0 ? (
                <span className="text-amber-300">{state.sessions.expired} (nettoyage automatique)</span>
              ) : (
                "0"
              )}
            </Fact>
          </dl>
        </Panel>

        <Panel title="Tentatives de connexion" description="Fenêtre de 24 heures, tous identifiants confondus.">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Échecs enregistrés sur 24 h">
              {state.attempts.total24h === 0 ? (
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone="ok" /> Aucun échec
                </span>
              ) : (
                <span className="text-amber-300">{state.attempts.total24h}</span>
              )}
            </Fact>
            <Fact label="Dernier échec">{when(state.attempts.lastFailure)}</Fact>
          </dl>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Au-delà de 5 échecs en 15 minutes sur un même identifiant, la connexion est bloquée jusqu&apos;à la fin de la fenêtre.
          </p>
        </Panel>

        <Panel title="Événements d'authentification" description="Sept derniers jours — le détail complet est dans le journal d'activité.">
          {state.events.length === 0 ? (
            <p className="text-sm text-muted">Aucun événement enregistré sur la période.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Événements d&apos;authentification</caption>
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Événement</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Nombre</th>
                    <th scope="col" className="py-2.5 font-semibold">Dernière fois</th>
                  </tr>
                </thead>
                <tbody>
                  {state.events.map((event) => (
                    <tr key={event.action} className="border-b border-line/60 last:border-0">
                      <td className="py-2.5 pr-4">{EVENT_LABELS[event.action] ?? event.action}</td>
                      <td className="py-2.5 pr-4 tabular-nums text-muted">{event.total}</td>
                      <td className="py-2.5 font-mono text-[11px] text-muted">{when(event.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Ce que cet écran ne montre jamais" tone="quiet">
          <ul className="list-disc space-y-1.5 pl-5 text-[12px] leading-relaxed text-muted">
            <li>Le secret TOTP chiffré (<code className="font-mono">totp_secret_enc</code>) et son contenu en clair.</li>
            <li>Les empreintes SHA-256 des jetons de session et des codes de secours.</li>
            <li>Les adresses IP (seule leur empreinte salée est stockée, et elle n&apos;est pas affichée).</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
