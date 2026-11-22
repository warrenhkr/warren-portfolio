import { Badge, PageHeader, Panel, StatusDot } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { BUCKET, isStorageConfigured, listMedia, MAX_BYTES, MIME_TYPES, type MediaItem } from "@/lib/media";
import { removeMedia, updateAlt, uploadFiles } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Écran « Médiathèque ».
 * Les fichiers vivent dans Supabase Storage (bucket public `media`), les métadonnées dans la
 * table `media`. Sans la clé de service, l'écran explique précisément ce qui manque : il ne
 * propose pas un envoi qui échouerait.
 */

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18]";
const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
const primaryBtn =
  "rounded-lg bg-[rgb(var(--btn))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--btn-ink))] transition-colors hover:bg-[rgb(var(--btn-hover))]";

function size(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  return `${Math.round(bytes / 1024)} ko`;
}

function MediaCard({ item }: { item: MediaItem }) {
  const used = item.usage > 0;
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-surface2/40">
      <div className="relative aspect-[4/3] bg-surface">
        {/* Image distante : `next/image` demanderait de déclarer le domaine Supabase à l'avance. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.alt.fr || item.filename}
          loading="lazy"
          className="size-full object-cover"
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg" title={item.filename}>
            {item.filename}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted">
            {item.folder || "(racine)"} · {size(item.sizeBytes)}
            {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={used ? "scheduled" : "neutral"}>
            {used ? `utilisé par ${item.usage} document${item.usage > 1 ? "s" : ""}` : "non utilisé"}
          </Badge>
          {!item.alt.fr && !item.alt.en ? <Badge tone="warn">alt manquant</Badge> : null}
        </div>

        <form action={updateAlt} className="space-y-2">
          <input type="hidden" name="id" value={item.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">alt fr</span>
              <input name="altFr" type="text" defaultValue={item.alt.fr} maxLength={300} className={`${inputClass} text-[12px]`} />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">alt en</span>
              <input name="altEn" type="text" defaultValue={item.alt.en} maxLength={300} className={`${inputClass} text-[12px]`} />
            </label>
          </div>
          <button type="submit" className="rounded-md border border-line px-2.5 py-1.5 text-xs text-fg transition-colors hover:bg-surface2">
            Enregistrer le texte alternatif
          </button>
        </form>

        <div className="space-y-1">
          <span className={labelClass}>Adresse publique</span>
          <input readOnly value={item.url} className={`${inputClass} font-mono text-[11px]`} onFocus={undefined} />
          <a href={item.url} target="_blank" rel="noreferrer noopener" className="text-[11px] text-muted underline hover:text-fg">
            Ouvrir dans un nouvel onglet
          </a>
        </div>

        <form action={removeMedia} className="border-t border-line pt-3">
          <input type="hidden" name="id" value={item.id} />
          <ConfirmSubmit
            message={`Supprimer définitivement « ${item.filename} » ? Le fichier part aussi du stockage.`}
            className="rounded-md border border-red-500/40 px-2.5 py-1.5 text-[11px] text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-40"
          >
            Supprimer
          </ConfirmSubmit>
          {used ? (
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              Encore référencé par un document : retirez-le d&apos;abord de son contenu.
            </p>
          ) : null}
        </form>
      </div>
    </li>
  );
}

export default async function MediaPage({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const configured = isStorageConfigured();
  const items = await listMedia();
  const total = items.reduce((sum, item) => sum + item.sizeBytes, 0);

  const feedback = searchParams.e
    ? { kind: "error" as const, text: searchParams.e }
    : searchParams.ok
      ? {
          kind: "ok" as const,
          text:
            searchParams.ok === "texte"
              ? "Texte alternatif enregistré."
              : searchParams.ok === "supprime"
                ? "Média supprimé (fichier et fiche)."
                : `${searchParams.ok} fichier(s) ajouté(s).`,
        }
      : null;

  return (
    <>
      <PageHeader
        title="Médiathèque"
        description="Images du portfolio, stockées dans Supabase Storage. Les textes alternatifs sont obligatoires pour l'accessibilité : un visuel sans description est signalé."
        meta={
          <>
            <Badge tone="neutral">
              {items.length} fichier{items.length > 1 ? "s" : ""}
            </Badge>
            <Badge tone="neutral">{size(total)} au total</Badge>
            <Badge tone={configured ? "published" : "warn"}>
              {configured ? "Stockage connecté" : "Stockage non configuré"}
            </Badge>
          </>
        }
      />

      <div className="space-y-6">
        {feedback ? (
          <p
            role={feedback.kind === "error" ? "alert" : "status"}
            className={`rounded-lg border px-4 py-2.5 text-sm ${
              feedback.kind === "ok"
                ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {feedback.text}
          </p>
        ) : null}

        {!configured && (
          <Panel title="Configuration requise" tone="quiet">
            <div className="space-y-3 text-sm leading-relaxed text-muted">
              <p className="flex items-start gap-2">
                <StatusDot tone="warn" className="mt-1.5" />
                <span>
                  Le bucket <code className="font-mono text-fg">{BUCKET}</code> existe déjà, mais l&apos;application n&apos;a
                  pas encore la clé qui autorise l&apos;envoi.
                </span>
              </p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Dans Supabase : <strong className="text-fg">Project Settings → API</strong>, copiez la clé{" "}
                  <code className="font-mono text-fg">service_role</code>.
                </li>
                <li>
                  Ajoutez-la dans <code className="font-mono text-fg">.env.local</code> (et dans les variables Vercel) sous le
                  nom <code className="font-mono text-fg">SUPABASE_SERVICE_ROLE_KEY</code>.
                </li>
                <li>Redémarrez le serveur : cet écran et l&apos;envoi s&apos;activent immédiatement.</li>
              </ol>
              <p className="text-[12px]">
                Cette clé ne doit jamais être préfixée <code className="font-mono">NEXT_PUBLIC_</code> : elle reste côté
                serveur, dans les Server Actions uniquement.
              </p>
            </div>
          </Panel>
        )}

        <Panel
          title="Ajouter des images"
          description={`JPEG, PNG, WebP, AVIF ou GIF · ${MAX_BYTES / (1024 * 1024)} Mo maximum par fichier.`}
        >
          <form action={uploadFiles} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="files" className={labelClass}>
                Fichiers
              </label>
              <input
                id="files"
                name="files"
                type="file"
                multiple
                required
                disabled={!configured}
                accept={MIME_TYPES.join(",")}
                className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[rgb(var(--btn))] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[rgb(var(--btn-ink))] disabled:opacity-50`}
              />
              <p className="text-[11px] leading-snug text-muted">
                Le nom est nettoyé automatiquement (accents et espaces retirés) et préfixé pour qu&apos;aucun fichier
                n&apos;écrase un autre.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className={labelClass}>Dossier (facultatif)</span>
                <input name="folder" type="text" placeholder="projets" className={`${inputClass} font-mono text-[12px]`} />
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Texte alternatif fr</span>
                <input name="altFr" type="text" maxLength={300} placeholder="Bras robotisé en cours de câblage" className={inputClass} />
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Texte alternatif en</span>
                <input name="altEn" type="text" maxLength={300} placeholder="Robot arm being wired" className={inputClass} />
              </label>
            </div>

            <button type="submit" disabled={!configured} className={`${primaryBtn} disabled:opacity-50`}>
              Envoyer
            </button>
          </form>
        </Panel>

        <Panel title={`${items.length} média${items.length > 1 ? "s" : ""}`}>
          {items.length === 0 ? (
            <p className="text-sm text-muted">
              Aucune image pour l&apos;instant. La page publique n&apos;en utilise aucune : le site est dessiné en SVG et en
              CSS, une image n&apos;est ajoutée que si elle apporte quelque chose.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
