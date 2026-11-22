import Link from "next/link";
import type { DocumentRow } from "@/lib/cms/documents";
import {
  deleteCertification,
  publishCertification,
  saveCertification,
  unpublishCertification,
} from "@/app/(admin)/admin/certifications/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

type Data = Record<string, unknown>;
type Bilingual = { fr?: string; en?: string };

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18]";
const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}

/** Formulaire d'une certification. La rubrique s'affiche sur /skills, sous les compétences. */
export function CertificationForm({
  doc,
  mode,
  feedback,
}: {
  doc: DocumentRow | null;
  mode: "new" | "edit";
  feedback?: { kind: "ok" | "error"; text: string } | null;
}) {
  const data = (doc?.draft?.data ?? {}) as Data;
  const isPublished = Boolean(doc?.published);
  const hasPending = doc?.has_unpublished_changes ?? false;
  const title = (data.title ?? {}) as Bilingual;

  return (
    <div className="space-y-6">
      {feedback ? (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.kind === "ok"
              ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <form action={saveCertification} className="space-y-7">
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <Field id="slug" label="Identifiant" hint="Lettres minuscules, chiffres et tirets (ex. cisco-ccna).">
            <input
              id="slug"
              name="slug"
              type="text"
              required
              readOnly={mode === "edit"}
              defaultValue={doc?.slug ?? ""}
              pattern="[a-z0-9][a-z0-9_-]{0,80}"
              className={`${inputClass} font-mono ${mode === "edit" ? "opacity-60" : ""}`}
            />
          </Field>

          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className={labelClass}>Intitulé de la certification</legend>
            {(["fr", "en"] as const).map((lang) => {
              const id = `title${lang === "fr" ? "Fr" : "En"}`;
              return (
                <div key={lang} className="space-y-1.5">
                  <label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                    <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">{lang}</span>
                    <span className="sr-only">Intitulé ({lang})</span>
                  </label>
                  <input id={id} name={id} type="text" defaultValue={title[lang] ?? ""} className={inputClass} />
                </div>
              );
            })}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="issuer" label="Émetteur (facultatif)" hint="Organisme réel : Cisco, Coursera, université…">
              <input id="issuer" name="issuer" type="text" maxLength={120} defaultValue={(data.issuer as string) ?? ""} className={inputClass} />
            </Field>
            <Field id="year" label="Année (facultatif)" hint="Texte libre court : 2024, mars 2025…">
              <input id="year" name="year" type="text" maxLength={20} defaultValue={(data.year as string) ?? ""} className={inputClass} />
            </Field>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Laissez un champ vide plutôt que d&apos;inventer : l&apos;affichage n&apos;ajoute alors rien après le titre.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-fg">Publication</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="order" label="Ordre d'affichage" hint="0 en premier.">
              <input id="order" name="order" type="number" min={0} defaultValue={doc?.draft?.order ?? 0} className={inputClass} />
            </Field>
            <label className="flex items-center gap-2.5 self-end pb-2 text-sm text-fg">
              <input type="checkbox" name="visible" defaultChecked={doc?.draft?.visible ?? true} className="size-4 accent-[rgb(var(--accent))]" />
              Visible sur le site
            </label>
          </div>
          <p className="text-[11px] leading-snug text-muted">
            {isPublished
              ? hasPending
                ? "Publié, mais le brouillon contient des modifications non publiées."
                : "Publié : la version en ligne est à jour."
              : "Brouillon : cette certification n'apparaît pas sur la page /skills."}
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" name="intent" value="draft" className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface2">
            Enregistrer le brouillon
          </button>
          <button
            type="submit"
            name="intent"
            value="publish"
            className="rounded-lg bg-[rgb(var(--btn))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--btn-ink))] transition-colors hover:bg-[rgb(var(--btn-hover))]"
          >
            {isPublished ? "Publier les modifications" : "Publier"}
          </button>
          <Link href="/admin/certifications" className="text-sm text-muted transition-colors hover:text-fg">
            Retour à la liste
          </Link>
        </div>
      </form>

      {mode === "edit" ? (
        <section className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-fg">Zone sensible</h2>
          <div className="flex flex-wrap gap-3">
            {isPublished ? (
              <form action={unpublishCertification}>
                <input type="hidden" name="slug" value={doc?.slug ?? ""} />
                <button type="submit" className="rounded-lg border border-line px-3.5 py-2 text-sm text-fg transition-colors hover:bg-surface2">
                  Retirer de la publication
                </button>
              </form>
            ) : (
              <form action={publishCertification}>
                <input type="hidden" name="slug" value={doc?.slug ?? ""} />
                <button type="submit" className="rounded-lg border border-line px-3.5 py-2 text-sm text-fg transition-colors hover:bg-surface2">
                  Publier ce brouillon
                </button>
              </form>
            )}
            <form action={deleteCertification}>
              <input type="hidden" name="slug" value={doc?.slug ?? ""} />
              <ConfirmSubmit
                message="Supprimer définitivement cette certification ? Cette action est irréversible."
                className="rounded-lg border border-red-500/40 px-3.5 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10"
              >
                Supprimer définitivement
              </ConfirmSubmit>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
