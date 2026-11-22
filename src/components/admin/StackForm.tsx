import Link from "next/link";
import type { DocumentRow } from "@/lib/cms/documents";
import { deleteTech, publishTech, saveTech, unpublishTech } from "@/app/(admin)/admin/stack/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

type Data = Record<string, unknown>;

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

export function StackForm({ doc, mode, feedback }: { doc: DocumentRow | null; mode: "new" | "edit"; feedback?: { kind: "ok" | "error"; text: string } | null }) {
  const data = (doc?.draft?.data ?? {}) as Data;
  const isPublished = Boolean(doc?.published);
  const hasPending = doc?.has_unpublished_changes ?? false;

  return (
    <div className="space-y-6">
      {feedback ? (
        <p
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.kind === "ok" ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <form action={saveTech} className="space-y-7">
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field id="slug" label="Identifiant" hint="Lettres minuscules, chiffres et tirets. Sert de clé interne (ex. nextjs).">
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
            <Field id="category" label="Catégorie">
              <select id="category" name="category" defaultValue={(data.category as string) ?? "software"} className={inputClass}>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
              </select>
            </Field>
          </div>

          <Field id="name" label="Nom affiché" hint="Nom commercial ou technique, 60 caractères maximum : ESP32, Next.js…">
            <input id="name" name="name" type="text" required maxLength={60} defaultValue={(data.name as string) ?? ""} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="status" label="Statut">
              <select id="status" name="status" defaultValue={(data.status as string) ?? "unconfirmed"} className={inputClass}>
                <option value="used">Utilisée</option>
                <option value="exploring">En exploration</option>
                <option value="unconfirmed">À confirmer</option>
              </select>
            </Field>
            <Field id="icon" label="Icône (facultative)" hint="Clé de logo : react, nextdotjs, typescript, espressif… Vide = pastille avec l'initiale.">
              <input id="icon" name="icon" type="text" pattern="[a-z0-9-]{1,40}" defaultValue={(data.icon as string) ?? ""} className={`${inputClass} font-mono`} />
            </Field>
          </div>
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
              : "Brouillon : cette technologie n'apparaît pas sur la page /stack."}
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
          <Link href="/admin/stack" className="text-sm text-muted transition-colors hover:text-fg">
            Retour à la liste
          </Link>
        </div>
      </form>

      {mode === "edit" ? (
        <section className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-fg">Zone sensible</h2>
          <div className="flex flex-wrap gap-3">
            {isPublished ? (
              <form action={unpublishTech}>
                <input type="hidden" name="slug" value={doc?.slug ?? ""} />
                <button type="submit" className="rounded-lg border border-line px-3.5 py-2 text-sm text-fg transition-colors hover:bg-surface2">
                  Retirer de la publication
                </button>
              </form>
            ) : (
              <form action={publishTech}>
                <input type="hidden" name="slug" value={doc?.slug ?? ""} />
                <button type="submit" className="rounded-lg border border-line px-3.5 py-2 text-sm text-fg transition-colors hover:bg-surface2">
                  Publier ce brouillon
                </button>
              </form>
            )}
            <form action={deleteTech}>
              <input type="hidden" name="slug" value={doc?.slug ?? ""} />
              <ConfirmSubmit
                message="Supprimer définitivement cette technologie ? Cette action est irréversible."
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
