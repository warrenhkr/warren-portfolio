import { requireAdmin } from "@/lib/auth/guard";
import { getDashboardStats, type CollectionCount, type DashboardStats } from "@/lib/admin/stats";
import { PageHeader, Panel, StatusDot } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  project: "Projets",
  skill: "Compétences",
  tech: "Technologies",
  ai_tool: "Outils IA",
  certification: "Certifications",
  nav_link: "Liens de navigation",
  social: "Réseaux sociaux",
  site: "Réglages du site",
  seo: "Pages SEO",
  lab_entry: "Laboratoire",
};

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Connexion à l’administration",
  "auth.logout": "Déconnexion",
  "document.create": "Document créé",
  "document.update": "Document modifié",
  "document.publish": "Document publié",
  "document.unpublish": "Document dépublié",
  "document.delete": "Document supprimé",
  "message.read": "Message lu",
  "message.delete": "Message supprimé",
  "media.upload": "Média ajouté",
  "media.delete": "Média supprimé",
};

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Date relative en français, sans dépendance ni décalage client (rendu serveur uniquement). */
function relativeFr(iso: string, now: number): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "date inconnue";
  const diff = now - time;
  if (diff < MINUTE) return "à l’instant";
  const minutes = Math.floor(diff / MINUTE);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(diff / HOUR);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(time));
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, " ");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Les libellés d'action contiennent parfois un identifiant brut : on l'abrège au lieu de l'étaler. */
function displayLabel(label: string | null): string | null {
  if (!label) return null;
  return UUID_RE.test(label) ? `#${label.slice(0, 8)}` : label;
}

type TileProps = {
  label: string;
  value: number | string;
  detail: string;
  emphasis?: boolean;
};

function Tile({ label, value, detail, emphasis }: TileProps) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${emphasis ? "text-accent" : "text-fg"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function countDetail(count: CollectionCount): string {
  if (count.total === 0) return "aucun document";
  const parts = [`${count.published} publié${count.published > 1 ? "s" : ""}`];
  if (count.drafts > 0) parts.push(`${count.drafts} brouillon${count.drafts > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count > 1 ? (pluralForm ?? `${singular}s`) : singular}`;
}

function DegradedNotice({ stats }: { stats: Extract<DashboardStats, { ok: false }> }) {
  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
      <p className="flex items-center gap-2 font-semibold">
        <StatusDot tone="warn" />
        Statistiques indisponibles — mode dégradé
      </p>
      <p className="mt-2 max-w-2xl leading-relaxed">
        La base de données n’a pas pu être interrogée (code&nbsp;:{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">{stats.code}</code>
        ), ou le schéma n’est pas encore appliqué. Aucun chiffre n’est affiché plutôt que d’afficher
        des valeurs inventées. Vérifiez <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">DATABASE_URL</code>{" "}
        et l’état des migrations, puis rechargez cette page.
      </p>
      {stats.latencyMs > 0 && (
        <p className="mt-2 text-xs text-amber-800">Échec après {stats.latencyMs} ms.</p>
      )}
    </section>
  );
}

function QuickAction({
  href,
  title,
  text,
  external,
  pending,
}: {
  href: string;
  title: string;
  text: string;
  external?: boolean;
  pending?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className="group block rounded-lg border border-line bg-surface2 px-4 py-3 transition-colors hover:border-accent/50 hover:bg-surface"
    >
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-fg">
        {title}
        <span aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-0.5">
          {external ? "↗" : "→"}
        </span>
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-muted">
        {text}
        {pending && (
          <span className="ml-1.5 inline-block rounded border border-amber-300 bg-amber-50 px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            page à venir
          </span>
        )}
      </span>
    </a>
  );
}

export default async function AdminDashboard() {
  await requireAdmin();
  const stats = await getDashboardStats();
  const now = Date.now();

  const header = (
    <PageHeader
      title="Tableau de bord"
      description="Vue d’ensemble du contenu et de l’activité, lue directement dans PostgreSQL."
      actions={
        <a
          href="/"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:border-accent/50"
        >
          Voir le portfolio public <span aria-hidden="true">↗</span>
        </a>
      }
    />
  );

  if (!stats.ok) {
    return (
      <>
        {header}
        <div className="space-y-6">
          <DegradedNotice stats={stats} />
          <Panel title="Actions rapides">
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction href="/projects" title="Gérer les projets" text="Liste et édition des projets du portfolio." pending />
              <QuickAction href="/admin/messages" title="Lire les messages" text="Messages reçus via le formulaire de contact." pending />
              <QuickAction href="/" title="Voir le portfolio public" text="Ouvre le site public dans un nouvel onglet." external />
            </div>
          </Panel>
        </div>
      </>
    );
  }

  const collections = stats.collections;
  const project = collections.project ?? { total: 0, published: 0, drafts: 0 };
  const skill = collections.skill ?? { total: 0, published: 0, drafts: 0 };
  const tech = collections.tech ?? { total: 0, published: 0, drafts: 0 };
  const aiTool = collections.ai_tool ?? { total: 0, published: 0, drafts: 0 };

  const publishedTotal = Object.values(collections).reduce((sum, c) => sum + c.published, 0);
  const draftsTotal = Object.values(collections).reduce((sum, c) => sum + c.drafts, 0);
  const empty = publishedTotal === 0;

  return (
    <>
      {header}
      <div className="space-y-6">
        {stats.missingTables.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            <StatusDot tone="warn" />
            Tables absentes du schéma&nbsp;:{" "}
            <span className="font-mono">{stats.missingTables.join(", ")}</span> — les blocs concernés
            sont marqués « non disponible » plutôt que remplis de zéros trompeurs.
          </p>
        )}

        {empty && (
          <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
            Aucun contenu publié pour l’instant. Les compteurs ci-dessous reflètent l’état réel de la
            base&nbsp;: rien n’est encore publié.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Tile label="Projets" value={project.total} detail={countDetail(project)} emphasis={project.total > 0} />
          <Tile label="Compétences" value={skill.total} detail={countDetail(skill)} />
          <Tile label="Technologies" value={tech.total} detail={countDetail(tech)} />
          <Tile label="Outils IA" value={aiTool.total} detail={countDetail(aiTool)} />
          <Tile
            label="Médiathèque"
            value={stats.media.available ? stats.media.total : "—"}
            detail={stats.media.available ? plural(stats.media.total, "fichier") : "table indisponible"}
          />
          <Tile
            label="Messages"
            value={stats.messages.available ? stats.messages.total : "—"}
            detail={
              !stats.messages.available
                ? "table indisponible"
                : stats.messages.unread > 0
                  ? `${plural(stats.messages.unread, "non lu", "non lus")} à lire`
                  : stats.messages.total === 0
                    ? "aucun message reçu"
                    : "tous lus"
            }
            emphasis={stats.messages.available && stats.messages.unread > 0}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="À traiter"
            aside={
              draftsTotal + stats.messages.unread === 0 ? (
                <span className="flex items-center gap-1.5 text-xs text-muted"><StatusDot tone="ok" />à jour</span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700"><StatusDot tone="warn" />action requise</span>
              )
            }
          >
            {draftsTotal + stats.messages.unread === 0 ? (
              <p className="text-sm text-muted">
                Rien à traiter&nbsp;: aucun brouillon en attente
                {stats.messages.available ? " et aucun message non lu" : ""}.
              </p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                <li className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <div>
                    <p className="font-medium text-fg">Brouillons à publier</p>
                    <p className="text-xs text-muted">
                      Documents enregistrés sans version publiée.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-semibold text-fg">{draftsTotal}</span>
                    <a href="/projects" className="text-xs font-medium text-accent hover:underline">Ouvrir</a>
                  </div>
                </li>
                <li className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-fg">Messages non lus</p>
                    <p className="text-xs text-muted">
                      {stats.messages.available
                        ? "Reçus via le formulaire de contact."
                        : "Table des messages indisponible."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-semibold text-fg">
                      {stats.messages.available ? stats.messages.unread : "—"}
                    </span>
                    <a href="/admin/messages" className="text-xs font-medium text-accent hover:underline">Ouvrir</a>
                  </div>
                </li>
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">
              Les pages /projects et /admin/messages ne sont pas encore livrées&nbsp;: ces liens
              mènent pour l’instant à une page inexistante.
            </p>
          </Panel>

          <Panel title="Activité récente" aside={<span className="text-xs text-muted">5 dernières entrées</span>}>
            {!stats.activity.available ? (
              <p className="text-sm text-muted">Journal d’activité indisponible (table absente).</p>
            ) : stats.activity.entries.length === 0 ? (
              <p className="text-sm text-muted">Aucune activité enregistrée pour l’instant.</p>
            ) : (
              <ol className="space-y-3.5">
                {stats.activity.entries.map((entry) => (
                  <li key={entry.id} className="flex gap-3 text-sm">
                    <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent/60" />
                    <div className="min-w-0">
                      <p className="text-fg">
                        {actionLabel(entry.action)}
                        {entry.collection && (
                          <span className="text-muted"> · {LABELS[entry.collection] ?? entry.collection}</span>
                        )}
                        {displayLabel(entry.label) && (
                          <span className="text-fg"> — {displayLabel(entry.label)}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted">{relativeFr(entry.at, now)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <Panel title="État du système">
          <dl className="divide-y divide-line text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
              <dt className="text-muted">Base de données PostgreSQL</dt>
              <dd className="flex items-center gap-2 font-medium"><StatusDot tone="ok" />Connectée</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-muted">Latence de la requête de statistiques</dt>
              <dd className="text-right font-medium tabular-nums">
                {stats.latencyMs} ms
                {stats.connectMs >= 50 && (
                  <span className="ml-1.5 text-xs font-normal text-muted">
                    (+ {stats.connectMs} ms d’ouverture de connexion)
                  </span>
                )}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-muted">Migrations appliquées</dt>
              <dd className="font-medium tabular-nums">
                {stats.migrations.length === 0 ? "aucune" : plural(stats.migrations.length, "migration")}
              </dd>
            </div>
            {stats.migrations.length > 0 && (
              <div className="py-3">
                <dt className="text-muted">Versions</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {stats.migrations.map((migration) => (
                    <span
                      key={`${migration.version}-${migration.name}`}
                      className="rounded border border-line bg-surface2 px-2 py-1 font-mono text-[11px] text-fg"
                    >
                      {migration.version}_{migration.name}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 py-3 last:pb-0">
              <dt className="text-muted">Accès à l’administration</dt>
              <dd className="flex items-center gap-2 text-xs font-medium text-amber-700">
                <StatusDot tone="warn" />ouvert en développement uniquement
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Actions rapides">
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction href="/projects" title="Gérer les projets" text="Liste et édition des projets du portfolio." pending />
            <QuickAction href="/admin/messages" title="Lire les messages" text="Messages reçus via le formulaire de contact." pending />
            <QuickAction href="/" title="Voir le portfolio public" text="Ouvre le site public dans un nouvel onglet." external />
          </div>
          <p className="mt-4 text-xs text-muted">
            Les pages /projects et /admin/messages seront livrées dans une phase ultérieure.
          </p>
        </Panel>
      </div>
    </>
  );
}
