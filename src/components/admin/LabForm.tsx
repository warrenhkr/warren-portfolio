import Link from "next/link";
import type { DocumentRow } from "@/lib/cms/documents";
import { deleteLabEntry, publishLabEntry, saveLabEntry, unpublishLabEntry } from "@/app/(admin)/admin/lab/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

type Data = Record<string, unknown>;
type Bilingual = { fr?: string; en?: string };

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18]";
const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

const KINDS = [
  { value: "experiment", label: "Expérimentation" },
  { value: "prototype", label: "Prototype" },
  { value: "test", label: "Test technique" },
  { value: "concept", label: "Concept en développement" },
  { value: "poc", label: "Preuve de concept" },
  { value: "exploration", label: "Exploration" },
];

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

/** Paire FR / EN côte à côte (une seule colonne sur mobile). */
function BilingualField({
  base,
  label,
  value,
  multiline = false,
  rows = 3,
}: {
  base: string;
  label: string;
  value?: Bilingual;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className={labelClass}>{label}</legend>
      {(["fr", "en"] as const).map((lang) => {
        const id = `${base}${lang === "fr" ? "Fr" : "En"}`;
        return (
          <div key={lang} className="space-y-1.5">
            <label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">{lang}</span>
              <span className="sr-only">{label}</span>
            </label>
            {multiline ? (
              <textarea id={id} name={id} rows={rows} defaultValue={value?.[lang] ?? ""} className={inputClass} />
            ) : (
              <input id={id} name={id} type="text" defaultValue={value?.[lang] ?? ""} className={inputClass} />
            )}
          </div>
        );
      })}
    </fieldset>
  );
}

export function LabForm({
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
  const tech = Array.isArray(data.tech) ? (data.tech as string[]).join(", ") : "";

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

      <form action={saveLabEntry} className="space-y-7">
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field id="slug" label="Identifiant" hint="Lettres minuscules, chiffres et tirets (ex. capteur-esp32).">
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
            <Field id="kind" label="Type d'entrée">
              <select id="kind" name="kind" defaultValue={(data.kind as string) ?? "experiment"} className={inputClass}>
                {KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="category" label="Domaine">
              <select id="category" name="category" defaultValue={(data.category as string) ?? "hardware"} className={inputClass}>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
              </select>
            </Field>
            <Field id="link" label="Lien (facultatif)" hint="URL http(s) vers une vidéo, un dépôt ou un article.">
              <input
                id="link"
                name="link"
                type="url"
                defaultValue={(data.link as string) ?? ""}
                placeholder="https://…"
                spellCheck={false}
                className={`${inputClass} font-mono text-[12px]`}
              />
            </Field>
          </div>

          <BilingualField base="title" label="Titre" value={data.title as Bilingual} />
          <BilingualField base="text" label="Description" value={data.text as Bilingual} multiline rows={3} />

          <Field id="tech" label="Technologies" hint="Séparées par des virgules : ESP32, C++, PlatformIO. 20 au maximum.">
            <input id="tech" name="tech" type="text" defaultValue={tech} placeholder="ESP32, C++" className={inputClass} />
          </Field>
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
              : "Brouillon : cette entrée n'apparaît pas sur la page /lab."}
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
          <Link href="/admin/lab" className="text-sm text-muted transition-colors hover:text-fg">
            Retour à la liste
          </Link>
        </div>
      </form>

      {mode === "edit" ? (
        <section className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-fg">Zone sensible</h2>
          <div className="flex flex-wrap gap-3">
            {isPublished ? (
              <form action={unpublishLabEntry}>
                <input type="hidden" name="slug" value={doc?.slug ?? ""} />
                <button type="submit" className="rounded-lg border border-line px-3.5 py-2 text-sm text-fg transition-colors hover:bg-surface2">
                  Retirer de la publication
                </button>
              </form>
            ) : (
              <form action={publishLabEntry}>
                <input type="hidden" name="slug" value={doc?.slug ?? ""} />
                <button type="submit" className="rounded-lg border border-line px-3.5 py-2 text-sm text-fg transition-colors hover:bg-surface2">
                  Publier ce brouillon
                </button>
              </form>
            )}
            <form action={deleteLabEntry}>
              <input type="hidden" name="slug" value={doc?.slug ?? ""} />
              <ConfirmSubmit
                message="Supprimer définitivement cette entrée du Lab ? Cette action est irréversible."
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
