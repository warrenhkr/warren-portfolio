import { Badge, Panel } from "@/components/admin/ui";
import { saveSeo, saveSite } from "@/app/(admin)/admin/settings/actions";
import type { Bilingual, SeoPage, SeoPagesRead, SiteSettingsRead } from "@/lib/cms/settings";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18]";
const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
const primaryBtn =
  "rounded-lg bg-[rgb(var(--btn))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--btn-ink))] transition-colors hover:bg-[rgb(var(--btn-hover))]";
const secondaryBtn = "rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface2";

/** Paire FR / EN côte à côte (une seule colonne sur mobile). */
function BilingualFields({
  slug,
  base,
  label,
  value,
  multiline = false,
  rows = 2,
  placeholder,
}: {
  slug: string;
  base: string;
  label: string;
  value: Bilingual;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className={labelClass}>{label}</legend>
      {(["fr", "en"] as const).map((lang) => {
        const id = `${slug}-${base}${lang === "fr" ? "Fr" : "En"}`;
        const name = `${base}${lang === "fr" ? "Fr" : "En"}`;
        return (
          <div key={lang} className="space-y-1.5">
            <label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">{lang}</span>
              <span className="sr-only">
                {label} ({lang})
              </span>
            </label>
            {multiline ? (
              <textarea id={id} name={name} rows={rows} defaultValue={value[lang]} placeholder={placeholder} className={inputClass} />
            ) : (
              <input id={id} name={name} type="text" defaultValue={value[lang]} placeholder={placeholder} className={inputClass} />
            )}
          </div>
        );
      })}
    </fieldset>
  );
}

function StatusLine({ doc }: { doc: { published: unknown; has_unpublished_changes: boolean } | null }) {
  if (!doc) return <Badge tone="draft">Fichiers</Badge>;
  if (!doc.published) return <Badge tone="draft">Brouillon</Badge>;
  if (doc.has_unpublished_changes) return <Badge tone="scheduled">Modifs à publier</Badge>;
  return <Badge tone="published">Publié</Badge>;
}

export function SettingsForm({
  site,
  seo,
  feedback,
}: {
  site: SiteSettingsRead;
  seo: SeoPagesRead;
  feedback?: { kind: "ok" | "error"; text: string } | null;
}) {
  return (
    <div className="space-y-6">
      {feedback ? (
        <p
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.kind === "ok"
              ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <Panel
        title="Identité du site"
        description="Nom affiché dans le menu, le pied de page et les métadonnées."
        actions={<StatusLine doc={site.doc} />}
      >
        <form action={saveSite} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="site-name" className={labelClass}>
                Nom du site
              </label>
              <input
                id="site-name"
                name="name"
                type="text"
                required
                maxLength={80}
                defaultValue={site.values.name}
                className={inputClass}
              />
              <p className="text-[11px] leading-snug text-muted">80 caractères maximum.</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="site-email" className={labelClass}>
                E-mail de contact
              </label>
              <input
                id="site-email"
                name="email"
                type="email"
                maxLength={200}
                defaultValue={site.values.email}
                placeholder="prenom@domaine.com"
                className={inputClass}
              />
              <p className="text-[11px] leading-snug text-muted">
                Laissez vide pour afficher « À renseigner » sur le site public, jamais un faux contact.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" name="intent" value="draft" className={secondaryBtn}>
              Enregistrer le brouillon
            </button>
            <button type="submit" name="intent" value="publish" className={primaryBtn}>
              Enregistrer et publier
            </button>
            {site.source === "fichiers" ? (
              <p className="text-[11px] leading-snug text-muted">
                Aucun document <code className="font-mono">site/main</code> en base : les valeurs affichées viennent de{" "}
                <code className="font-mono">src/content/site.ts</code>. La première validation créera le document.
              </p>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel
        title="SEO par page"
        description="Titre et description bilingues, un document par page publique (collection seo)."
        actions={<Badge tone={seo.source === "base" ? "neutral" : "warn"}>{seo.pages.length} pages</Badge>}
      >
        <div className="space-y-5">
          {seo.pages.map((page: SeoPage) => (
            <form
              key={page.slug}
              action={saveSeo}
              className="space-y-4 rounded-xl border border-line bg-surface2/40 p-4"
            >
              <input type="hidden" name="slug" value={page.slug} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-fg">{page.label}</h3>
                  <p className="font-mono text-[11px] text-muted">
                    {page.path || `document « ${page.slug} »`} · slug <span className="text-fg/70">{page.slug}</span>
                  </p>
                </div>
                <StatusLine doc={page.doc} />
              </div>

              <BilingualFields slug={page.slug} base="title" label="Titre" value={page.title} placeholder="Titre de la page" />
              <BilingualFields
                slug={page.slug}
                base="description"
                label="Description"
                value={page.description}
                multiline
                rows={2}
                placeholder="Résumé affiché par les moteurs de recherche"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" name="intent" value="draft" className={secondaryBtn}>
                  Enregistrer le brouillon
                </button>
                <button type="submit" name="intent" value="publish" className={primaryBtn}>
                  Enregistrer et publier
                </button>
              </div>
            </form>
          ))}
        </div>
      </Panel>
    </div>
  );
}
