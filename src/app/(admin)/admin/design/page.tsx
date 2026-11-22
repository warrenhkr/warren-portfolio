import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  Select,
  Skeleton,
  StatTile,
  StatusDot,
  TabsSimple,
  TextArea,
  TextInput,
  Toggle,
  Toolbar,
  type DataColumn,
} from "@/components/admin/ui";

export const metadata = { title: { absolute: "Planche de style · Administration" } };

/* ─────────────────────────────────────────────────────────────
   DONNÉES FICTIVES — tout est étiqueté « exemple ».
   Rien ici ne provient de la base.
   ───────────────────────────────────────────────────────────── */

type ExempleStatut = "published" | "draft" | "scheduled" | "archived";

type ExempleDocument = {
  id: string;
  titre: string;
  type: string;
  statut: ExempleStatut;
  locale: "FR" | "EN";
  maj: string;
  vues: number;
};

const EXEMPLES: ExempleDocument[] = [
  { id: "ex-01", titre: "Refonte de la page projets", type: "Projet", statut: "published", locale: "FR", maj: "12 nov. 2026", vues: 1284 },
  { id: "ex-02", titre: "Note sur les agents locaux", type: "Article", statut: "draft", locale: "FR", maj: "10 nov. 2026", vues: 0 },
  { id: "ex-03", titre: "Design system — inventaire", type: "Page", statut: "scheduled", locale: "EN", maj: "09 nov. 2026", vues: 42 },
  { id: "ex-04", titre: "Ancienne fiche stack 2023", type: "Technologie", statut: "archived", locale: "FR", maj: "02 sept. 2026", vues: 310 },
  { id: "ex-05", titre: "Signal : journal de bord", type: "Article", statut: "published", locale: "EN", maj: "28 oct. 2026", vues: 876 },
];

const COLONNES: Array<DataColumn<ExempleDocument>> = [
  {
    key: "titre",
    header: "Titre",
    cell: (row) => (
      <span className="block max-w-[22rem] truncate font-medium text-fg">{row.titre}</span>
    ),
  },
  {
    key: "type",
    header: "Type",
    hideBelow: "sm",
    cell: (row) => <span className="text-muted">{row.type}</span>,
  },
  {
    key: "statut",
    header: "Statut",
    cell: (row) => <Badge tone={row.statut} />,
  },
  {
    key: "locale",
    header: "Langue",
    align: "center",
    hideBelow: "md",
    cell: (row) => <span className="font-mono text-[11px] text-muted">{row.locale}</span>,
  },
  {
    key: "maj",
    header: "Modifié",
    align: "right",
    hideBelow: "md",
    cell: (row) => <span className="text-muted tabular-nums">{row.maj}</span>,
  },
  {
    key: "vues",
    header: "Vues",
    align: "right",
    cell: (row) => <span className="tabular-nums text-fg">{row.vues.toLocaleString("fr-FR")}</span>,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    width: "1%",
    cell: () => (
      <Button variant="ghost" size="sm">
        Ouvrir
      </Button>
    ),
  },
];

const COLONNES_MINI: Array<DataColumn<ExempleDocument>> = [
  { key: "titre", header: "Titre", cell: (row) => <span className="block max-w-[14rem] truncate text-fg">{row.titre}</span> },
  { key: "statut", header: "Statut", align: "right", cell: (row) => <Badge tone={row.statut} /> },
];

/* ─────────────────────────────────────────────────────────────
   PETITS BLOCS DE LA PLANCHE
   ───────────────────────────────────────────────────────────── */

function Section({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.08em] text-muted">{index}</span>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg">{title}</h2>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        {hint && <span className="hidden text-[11px] text-muted sm:block">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ token, name, role }: { token: string; name: string; role: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="h-10 border-b border-line" style={{ background: `rgb(var(${token}))` }} />
      <div className="px-2 py-1.5">
        <p className="font-mono text-[10px] text-fg">{token}</p>
        <p className="truncate text-[10px] text-muted">
          {name} · {role}
        </p>
      </div>
    </div>
  );
}

function MiniKit({ prefix }: { prefix: string }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Brouillons"
          value={7}
          hint="exemple"
          delta={{ label: "+2", direction: "up", intent: "warn" }}
        />
        <StatTile label="Publiés" value={128} unit="doc." hint="exemple" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="published" />
        <Badge tone="draft" />
        <Badge tone="scheduled" />
        <Badge tone="archived" />
      </div>

      <DataTable
        columns={COLONNES_MINI}
        rows={EXEMPLES.slice(0, 3)}
        getRowKey={(row) => `${prefix}-${row.id}`}
        dense
        footer="3 documents d'exemple"
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm">
          Enregistrer
        </Button>
        <Button size="sm">Annuler</Button>
        <Button variant="ghost" size="sm">
          Aperçu
        </Button>
        <Button variant="danger" size="sm">
          Supprimer
        </Button>
      </div>

      <Field id={`${prefix}-slug`} label="Slug" description="Chemin public, sans espace ni accent.">
        {(control) => <TextInput {...control} defaultValue="design-system" />}
      </Field>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────── */

export default function DesignBoardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Phase 2 · socle visuel"
        title="Planche de style"
        description="Tous les composants du kit admin, dans les deux thèmes. Console d'édition : dense, lisible, verre dépoli discret."
        meta={
          <>
            <Badge tone="info" plain>
              exemple
            </Badge>
            <span className="text-xs text-muted">Données fictives — aucun contenu réel</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost">Documentation</Button>
            <Button variant="primary">Composant primaire</Button>
          </>
        }
      />

      <div className="mb-10 flex items-start gap-3 rounded-xl border border-line bg-surface2 px-4 py-3">
        <Badge tone="warn" plain>
          à valider
        </Badge>
        <p className="text-xs leading-relaxed text-muted">
          Maquette vivante : chaque valeur affichée est un{" "}
          <strong className="font-semibold text-fg">exemple</strong>. Les signatures exportées par{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px] text-fg">
            components/admin/ui
          </code>{" "}
          sont celles que consommeront les CRUD des phases suivantes.
        </p>
      </div>

      <div className="space-y-10">
        {/* 01 — jetons */}
        <Section index="01" title="Jetons de couleur" hint="tokens hérités">
          <Panel tone="quiet" padded>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
              <Swatch token="--bg" name="bg" role="fond" />
              <Swatch token="--surface" name="surface" role="panneaux" />
              <Swatch token="--surface2" name="surface2" role="bandes" />
              <Swatch token="--line" name="line" role="bordures" />
              <Swatch token="--fg" name="fg" role="texte" />
              <Swatch token="--muted" name="muted" role="secondaire" />
              <Swatch token="--accent" name="accent" role="action" />
              <Swatch token="--side" name="side" role="navigation" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Swatch token="--ok" name="ok" role="publié" />
              <Swatch token="--warn" name="warn" role="brouillon" />
              <Swatch token="--info" name="info" role="à publier" />
              <Swatch token="--neutral" name="neutral" role="archivé" />
              <Swatch token="--danger" name="danger" role="destructif" />
            </div>
          </Panel>
        </Section>

        {/* 02 — mesures */}
        <Section index="02" title="Tuiles de mesure" hint="StatTile">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Documents"
              value={142}
              unit="en base"
              hint="exemple"
              icon={
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                  <path d="M5 3h7l3 3v11H5z" strokeLinejoin="round" />
                  <path d="M8 9h4M8 12h4" strokeLinecap="round" />
                </svg>
              }
            />
            <StatTile
              label="Brouillons"
              value={7}
              delta={{ label: "+2 cette semaine", direction: "up", intent: "warn" }}
              hint="exemple"
              tone="glass"
            />
            <StatTile
              label="Vues 30 j"
              value="12,4"
              unit="k"
              delta={{ label: "-3,1 %", direction: "down", intent: "danger" }}
              hint="exemple"
            />
            <StatTile
              label="Dernier import"
              value="il y a 2 h"
              hint="exemple"
              footer={
                <span className="flex items-center gap-1.5">
                  <StatusDot tone="ok" />
                  base connectée
                </span>
              }
            />
          </div>
        </Section>

        {/* 03 — statuts */}
        <Section index="03" title="Statuts & pastilles" hint="Badge · StatusDot">
          <Panel title="États éditoriaux" description="Contraste vérifié dans les deux thèmes.">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="published" />
              <Badge tone="draft" />
              <Badge tone="scheduled" />
              <Badge tone="archived" />
              <Badge tone="neutral" plain>
                sans état
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-line pt-4 text-xs text-muted">
              <span className="flex items-center gap-2">
                <StatusDot tone="ok" /> service nominal
              </span>
              <span className="flex items-center gap-2">
                <StatusDot tone="warn" /> attention requise
              </span>
              <span className="flex items-center gap-2">
                <StatusDot tone="error" /> erreur bloquante
              </span>
            </div>
          </Panel>
        </Section>

        {/* 04 — console de liste */}
        <Section index="04" title="Console de liste" hint="Panel · Toolbar · DataTable">
          <Panel
            padded={false}
            title="Contenus"
            description="Tri, filtre et recherche — emplacements prêts pour la phase 3."
            actions={
              <>
                <Button variant="ghost" size="sm">
                  Exporter
                </Button>
                <Button variant="primary" size="sm">
                  Nouveau document
                </Button>
              </>
            }
          >
            <Toolbar
              searchName="exemple-q"
              searchPlaceholder="Rechercher un titre…"
              filters={
                <>
                  <Select id="exemple-type" defaultValue="tous" className="h-9 w-auto min-w-32">
                    <option value="tous">Tous les types</option>
                    <option value="projet">Projets</option>
                    <option value="article">Articles</option>
                    <option value="page">Pages</option>
                  </Select>
                  <Select id="exemple-statut" defaultValue="tous" className="h-9 w-auto min-w-32">
                    <option value="tous">Tous les statuts</option>
                    <option value="published">Publiés</option>
                    <option value="draft">Brouillons</option>
                  </Select>
                </>
              }
              views={
                <TabsSimple
                  name="exemple-locale"
                  size="sm"
                  label="Langue"
                  defaultValue="fr"
                  items={[
                    { id: "fr", label: "FR", badge: 4 },
                    { id: "en", label: "EN", badge: 1 },
                  ]}
                />
              }
              secondary={
                <Button variant="ghost" size="sm">
                  Colonnes
                </Button>
              }
            />
            <div className="p-3 sm:p-4">
              <DataTable
                columns={COLONNES}
                rows={EXEMPLES}
                getRowKey={(row) => row.id}
                caption="Documents d'exemple"
                dense
                footer="5 documents d'exemple · pagination à brancher en phase 3"
                className="border-line/70"
              />
            </div>
          </Panel>
        </Section>

        {/* 05 — états */}
        <Section index="05" title="États de la table" hint="vide · chargement">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="État vide" padded={false}>
              <div className="p-3 sm:p-4">
                <DataTable
                  columns={COLONNES}
                  rows={[]}
                  getRowKey={(row) => row.id}
                  empty={
                    <EmptyState
                      bare
                      title="Aucun document"
                      text="Cette collection est vide. Créez un premier document pour la remplir."
                      className="mx-auto max-w-sm"
                      action={
                        <Button variant="primary" size="sm">
                          Créer un document
                        </Button>
                      }
                    />
                  }
                />
              </div>
            </Panel>

            <Panel title="Chargement" padded={false} description="Squelette figé si prefers-reduced-motion.">
              <div className="p-3 sm:p-4">
                <DataTable
                  columns={COLONNES}
                  rows={[]}
                  getRowKey={(row) => row.id}
                  loading
                  skeletonRows={5}
                />
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-surface2 px-3 py-2">
                  <Skeleton className="h-2 w-24" />
                  <Skeleton className="h-2 w-12" />
                  <span className="ml-auto text-[11px] text-muted">squelette isolé</span>
                </div>
              </div>
            </Panel>
          </div>
        </Section>

        {/* 06 — formulaire */}
        <Section index="06" title="Formulaire" hint="Field · inputs · Button">
          <Panel title="Nouveau document" description="Libellés reliés par htmlFor, erreur associée en aria-describedby.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="exemple-titre"
                label="Titre"
                required
                description="Visible dans la navigation du site."
              >
                {(control) => <TextInput {...control} placeholder="Ex. Refonte du portfolio" />}
              </Field>

              <Field id="exemple-slug" label="Slug" description="Généré depuis le titre si laissé vide.">
                {(control) => <TextInput {...control} placeholder="refonte-portfolio" />}
              </Field>

              <Field
                id="exemple-collection"
                label="Collection"
                required
                description="Détermine le schéma de validation."
              >
                {(control) => (
                  <Select {...control} defaultValue="projet">
                    <option value="projet">Projet</option>
                    <option value="article">Article</option>
                    <option value="page">Page</option>
                    <option value="technologie">Technologie</option>
                  </Select>
                )}
              </Field>

              <Field
                id="exemple-statut-champ"
                label="Statut de publication"
                description="Un brouillon n'est jamais servi par le site public."
              >
                {(control) => (
                  <Select {...control} defaultValue="draft">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="scheduled">À publier</option>
                    <option value="archived">Archivé</option>
                  </Select>
                )}
              </Field>

              <Field
                id="exemple-resume"
                label="Résumé"
                description="160 caractères maximum, repris dans les métadonnées."
                error="Le résumé dépasse la longueur autorisée."
                className="sm:col-span-2"
              >
                {(control) => (
                  <TextArea
                    {...control}
                    defaultValue="Exemple de résumé trop long pour illustrer l'état d'erreur du champ."
                  />
                )}
              </Field>

              <div className="space-y-3 rounded-lg border border-line bg-surface2/60 p-3 sm:col-span-2">
                <Toggle
                  id="exemple-publie"
                  label="Publier immédiatement"
                  description="Décochez pour conserver le document en brouillon."
                />
                <Toggle
                  id="exemple-index"
                  label="Indexer par les moteurs"
                  description="Désactivé → robots noindex sur la page publique."
                  defaultChecked
                />
                <Toggle id="exemple-verrou" label="Verrouiller l'édition" disabled description="Réservé aux administrateurs." />
              </div>

              <Field id="exemple-langue" label="Langue" description="Une fiche par langue.">
                {(control) => (
                  <div className="pt-1">
                    <TabsSimple
                      name={control.id}
                      label="Langue du document"
                      defaultValue="fr"
                      items={[
                        { id: "fr", label: "FR" },
                        { id: "en", label: "EN" },
                      ]}
                    />
                  </div>
                )}
              </Field>

              <Field id="exemple-tags" label="Étiquettes" description="Séparées par des virgules.">
                {(control) => <TextInput {...control} placeholder="design, nextjs, éditorial" />}
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button variant="primary">Enregistrer</Button>
              <Button>Aperçu</Button>
              <Button variant="ghost">Annuler</Button>
              <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
              <Button variant="danger">Supprimer</Button>
              <Button variant="primary" disabled className="ml-auto">
                Indisponible
              </Button>
            </div>
          </Panel>
        </Section>

        {/* 07 — comparaison */}
        <Section index="07" title="Les deux thèmes" hint="même kit, mêmes tokens">
          <div className="grid gap-4 lg:grid-cols-2">
            <div
              data-admin-theme="dark"
              className="rounded-xl border border-line p-4"
            >
              <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                <Badge tone="neutral" plain>
                  sombre
                </Badge>
                data-admin-theme=&quot;dark&quot;
              </p>
              <MiniKit prefix="sombre" />
            </div>

            <div
              data-admin-theme="light"
              className="rounded-xl border border-line p-4"
            >
              <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                <Badge tone="neutral" plain>
                  clair
                </Badge>
                data-admin-theme=&quot;light&quot;
              </p>
              <MiniKit prefix="clair" />
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Hors encadré, les composants suivent le thème du document (
            <code className="font-mono">html.dark</code>) : la planche se relit donc dans le thème
            réellement actif.
          </p>
        </Section>
      </div>
    </>
  );
}
