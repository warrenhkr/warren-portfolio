import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { readNavLinks, readSocials } from "@/lib/cms/settings";
import { addNav, addSoc, moveNav, moveSoc, removeNav, removeSoc, saveNav, saveSoc } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Écran « Navigation et footer ».
 * Deux collections : `nav_link` (menu du rail et du tiroir mobile) et `social` (pied de page).
 * L'identifiant de chaque entrée est déduit de sa destination : on ne le saisit jamais à la main.
 */

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18]";
const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
const primaryBtn =
  "rounded-lg bg-[rgb(var(--btn))] px-3.5 py-2 text-xs font-semibold text-[rgb(var(--btn-ink))] transition-colors hover:bg-[rgb(var(--btn-hover))]";
const secondaryBtn = "rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-fg transition-colors hover:bg-surface2";
const iconBtn = "grid size-8 place-items-center rounded-md border border-line text-muted transition-colors hover:bg-surface2 hover:text-fg";

const OK: Record<string, string> = {
  "lien-enregistre": "Lien enregistré en brouillon.",
  "lien-publie": "Lien enregistré et publié.",
  "lien-ajoute": "Lien ajouté au menu et publié.",
  "lien-supprime": "Lien supprimé.",
  "reseau-enregistre": "Réseau enregistré en brouillon.",
  "reseau-publie": "Réseau enregistré et publié.",
  "reseau-ajoute": "Réseau ajouté et publié.",
  "reseau-supprime": "Réseau supprimé.",
  "ordre-modifie": "Ordre mis à jour et publié.",
};

function statusOf(entry: { published: boolean; hasPending: boolean }) {
  if (!entry.published) return { tone: "draft" as const, label: "Brouillon" };
  if (entry.hasPending) return { tone: "scheduled" as const, label: "Modifs à publier" };
  return { tone: "published" as const, label: "Publié" };
}

export default async function NavigationPage({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const [nav, socials] = await Promise.all([readNavLinks(), readSocials()]);

  return (
    <>
      <PageHeader
        title="Navigation et footer"
        description="Le menu du site et les liens du pied de page. Chaque entrée existe en brouillon et en version publiée : rien ne change sur le site avant publication."
        meta={
          <>
            <Badge tone={nav.source === "base" ? "neutral" : "warn"}>
              {nav.source === "base" ? `${nav.items.length} liens en base` : "Liens depuis les fichiers"}
            </Badge>
            <Badge tone={socials.source === "base" ? "neutral" : "warn"}>
              {socials.source === "base" ? `${socials.items.length} réseaux en base` : "Réseaux depuis les fichiers"}
            </Badge>
          </>
        }
      />

      <div className="space-y-6">
        {searchParams.ok ? (
          <p role="status" className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-2.5 text-sm text-emerald-300">
            {OK[searchParams.ok] ?? "Action effectuée."}
          </p>
        ) : null}
        {searchParams.e ? (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {searchParams.e}
          </p>
        ) : null}

        {(nav.source === "fichiers" || socials.source === "fichiers") && (
          <p className="rounded-lg border border-line bg-surface2/50 px-4 py-3 text-[12px] leading-relaxed text-muted">
            La base ne contient pas encore de menu complet : les entrées affichées viennent de{" "}
            <code className="font-mono">src/content/site.ts</code>. Tant que rien n&apos;est enregistré ici, le site
            continue d&apos;utiliser ces fichiers — c&apos;est le repli prévu, jamais un écran vide.
          </p>
        )}

        <Panel
          title="Menu principal"
          description="Ordre d'affichage dans le rail (bureau) et dans le tiroir (mobile)."
        >
          <ol className="space-y-3">
            {nav.items.map((item, index) => {
              const status = statusOf(item);
              return (
                <li key={item.slug} className="rounded-xl border border-line bg-surface2/40 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
                      <code className="truncate rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-fg/80">{item.href}</code>
                      {!item.visible ? <Badge tone="warn">Masqué</Badge> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <form action={moveNav} className="flex gap-1">
                        <input type="hidden" name="slug" value={item.slug} />
                        <button type="submit" name="dir" value="up" disabled={index === 0} aria-label={`Monter « ${item.label.fr || item.slug} »`} className={`${iconBtn} disabled:opacity-30`}>
                          ↑
                        </button>
                        <button type="submit" name="dir" value="down" disabled={index === nav.items.length - 1} aria-label={`Descendre « ${item.label.fr || item.slug} »`} className={`${iconBtn} disabled:opacity-30`}>
                          ↓
                        </button>
                      </form>
                    </div>
                  </div>

                  <form action={saveNav} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="slug" value={item.slug} />
                    <div className="space-y-1.5">
                      <label htmlFor={`${item.slug}-fr`} className={labelClass}>
                        Libellé <span className="font-mono lowercase">fr</span>
                      </label>
                      <input id={`${item.slug}-fr`} name="labelFr" type="text" defaultValue={item.label.fr} maxLength={120} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`${item.slug}-en`} className={labelClass}>
                        Libellé <span className="font-mono lowercase">en</span>
                      </label>
                      <input id={`${item.slug}-en`} name="labelEn" type="text" defaultValue={item.label.en} maxLength={120} className={inputClass} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor={`${item.slug}-href`} className={labelClass}>
                        Destination
                      </label>
                      <input
                        id={`${item.slug}-href`}
                        name="href"
                        type="text"
                        required
                        defaultValue={item.href}
                        placeholder="/contact"
                        spellCheck={false}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      <button type="submit" name="intent" value="draft" className={secondaryBtn}>
                        Enregistrer le brouillon
                      </button>
                      <button type="submit" name="intent" value="publish" className={primaryBtn}>
                        Publier
                      </button>
                    </div>
                  </form>

                  <form action={removeNav} className="mt-3 border-t border-line pt-3">
                    <input type="hidden" name="slug" value={item.slug} />
                    <ConfirmSubmit
                      message={`Supprimer le lien « ${item.label.fr || item.slug} » du menu ? Le site repassera sur le fichier de repli s'il n'en reste aucun.`}
                      className="rounded-md border border-red-500/40 px-2.5 py-1.5 text-[11px] text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      Supprimer ce lien
                    </ConfirmSubmit>
                  </form>
                </li>
              );
            })}
          </ol>

          <form action={addNav} className="mt-5 rounded-xl border border-dashed border-line p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Ajouter un lien</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="labelFr" type="text" placeholder="Libellé FR" maxLength={120} className={inputClass} aria-label="Libellé français" />
              <input name="labelEn" type="text" placeholder="Libellé EN" maxLength={120} className={inputClass} aria-label="Libellé anglais" />
              <input
                name="href"
                type="text"
                required
                placeholder="/nouvelle-page"
                spellCheck={false}
                className={`${inputClass} font-mono`}
                aria-label="Destination"
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              L&apos;identifiant est déduit de la destination (« / » donne <code className="font-mono">home</code>) et le lien est
              publié immédiatement, à placer ensuite avec les flèches.
            </p>
            <button type="submit" className={`${primaryBtn} mt-3`}>
              Ajouter au menu
            </button>
          </form>
        </Panel>

        <Panel title="Pied de page — réseaux" description="Liens vers tes profils. Un lien vide reste affiché « À renseigner » plutôt qu'un faux profil.">
          <ol className="space-y-3">
            {socials.items.map((item, index) => {
              const status = statusOf(item);
              return (
                <li key={item.slug} className="rounded-xl border border-line bg-surface2/40 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
                      <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-fg/80">{item.platform}</code>
                      {!item.visible ? <Badge tone="warn">Masqué</Badge> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <form action={moveSoc} className="flex gap-1">
                        <input type="hidden" name="slug" value={item.slug} />
                        <button type="submit" name="dir" value="up" disabled={index === 0} aria-label={`Monter « ${item.label} »`} className={`${iconBtn} disabled:opacity-30`}>
                          ↑
                        </button>
                        <button type="submit" name="dir" value="down" disabled={index === socials.items.length - 1} aria-label={`Descendre « ${item.label} »`} className={`${iconBtn} disabled:opacity-30`}>
                          ↓
                        </button>
                      </form>
                    </div>
                  </div>

                  <form action={saveSoc} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="slug" value={item.slug} />
                    <input type="hidden" name="platform" value={item.platform} />
                    <div className="space-y-1.5">
                      <label htmlFor={`soc-${item.slug}-label`} className={labelClass}>
                        Nom affiché
                      </label>
                      <input id={`soc-${item.slug}-label`} name="label" type="text" required defaultValue={item.label} maxLength={40} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`soc-${item.slug}-url`} className={labelClass}>
                        URL du profil
                      </label>
                      <input
                        id={`soc-${item.slug}-url`}
                        name="url"
                        type="url"
                        defaultValue={item.url}
                        placeholder="https://…"
                        spellCheck={false}
                        className={`${inputClass} font-mono text-[12px]`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      <button type="submit" name="intent" value="draft" className={secondaryBtn}>
                        Enregistrer le brouillon
                      </button>
                      <button type="submit" name="intent" value="publish" className={primaryBtn}>
                        Publier
                      </button>
                    </div>
                  </form>

                  <form action={removeSoc} className="mt-3 border-t border-line pt-3">
                    <input type="hidden" name="slug" value={item.slug} />
                    <ConfirmSubmit
                      message={`Supprimer « ${item.label} » du pied de page ?`}
                      className="rounded-md border border-red-500/40 px-2.5 py-1.5 text-[11px] text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      Supprimer ce réseau
                    </ConfirmSubmit>
                  </form>
                </li>
              );
            })}
          </ol>

          <form action={addSoc} className="mt-5 rounded-xl border border-dashed border-line p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Ajouter un réseau</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="platform" type="text" required placeholder="github" spellCheck={false} className={`${inputClass} font-mono`} aria-label="Plateforme" />
              <input name="label" type="text" required placeholder="Nom affiché" maxLength={40} className={inputClass} aria-label="Nom affiché" />
              <input name="url" type="url" placeholder="https://…" spellCheck={false} className={`${inputClass} font-mono text-[12px]`} aria-label="URL du profil" />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              La plateforme sert d&apos;identifiant (minuscules, sans espace) et ne peut pas être réutilisée.
            </p>
            <button type="submit" className={`${primaryBtn} mt-3`}>
              Ajouter au pied de page
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}
