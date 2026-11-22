import Link from "next/link";
import { listDocuments } from "@/lib/cms/documents";
import { PageHeader, Badge, Panel } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { deleteLabEntry, publishLabEntry, unpublishLabEntry } from "./actions";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  experiment: "Expérimentation",
  prototype: "Prototype",
  test: "Test technique",
  concept: "Concept",
  poc: "Preuve de concept",
  exploration: "Exploration",
};

function statusOf(doc: { published: unknown; has_unpublished_changes: boolean }) {
  if (!doc.published) return { tone: "draft" as const, label: "Brouillon" };
  if (doc.has_unpublished_changes) return { tone: "scheduled" as const, label: "Modifs à publier" };
  return { tone: "published" as const, label: "Publié" };
}

export default async function LabPage({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const docs = await listDocuments("lab_entry");

  return (
    <>
      <PageHeader
        title="Lab"
        description="Expérimentations, prototypes, tests et concepts. Rien n'apparaît sur /lab avant publication."
        actions={
          <Link
            href="/admin/lab/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--btn))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--btn-ink))] transition-colors hover:bg-[rgb(var(--btn-hover))]"
          >
            Nouvelle entrée
          </Link>
        }
      />

      <div className="space-y-5">
        {searchParams.ok ? (
          <p role="status" className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-2.5 text-sm text-emerald-300">
            Action effectuée : {searchParams.ok}.
          </p>
        ) : null}
        {searchParams.e ? (
          <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {searchParams.e}
          </p>
        ) : null}

        <Panel title={`${docs.length} entrée${docs.length > 1 ? "s" : ""}`}>
          {docs.length === 0 ? (
            <p className="text-sm text-muted">
              Rien en base pour l&apos;instant. La page /lab affiche son état vide — créez une première entrée pour la
              remplir.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Entrées du Lab</caption>
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Titre</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Type</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Domaine</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Statut</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Ordre</th>
                    <th scope="col" className="py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => {
                    const status = statusOf(doc);
                    const title = (doc.draft.data.title as { fr?: string; en?: string } | undefined)?.fr || doc.slug;
                    const kind = String(doc.draft.data.kind ?? "");
                    return (
                      <tr key={doc.slug} className="border-b border-line/60 align-middle last:border-0">
                        <td className="py-3 pr-4">
                          <Link href={`/admin/lab/${doc.slug}`} className="font-medium text-fg hover:underline">
                            {title}
                          </Link>
                          <p className="font-mono text-[11px] text-muted">{doc.slug}</p>
                        </td>
                        <td className="py-3 pr-4 text-muted">{KIND_LABELS[kind] ?? kind}</td>
                        <td className="py-3 pr-4 capitalize text-muted">{String(doc.draft.data.category ?? "")}</td>
                        <td className="py-3 pr-4">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-muted">{doc.draft.order}</td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/lab/${doc.slug}`}
                              className="rounded-md border border-line px-2.5 py-1.5 text-xs text-fg transition-colors hover:bg-surface2"
                            >
                              Éditer
                            </Link>
                            {doc.published ? (
                              <form action={unpublishLabEntry}>
                                <input type="hidden" name="slug" value={doc.slug} />
                                <button type="submit" className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-surface2 hover:text-fg">
                                  Dépublier
                                </button>
                              </form>
                            ) : (
                              <form action={publishLabEntry}>
                                <input type="hidden" name="slug" value={doc.slug} />
                                <button type="submit" className="rounded-md border border-line px-2.5 py-1.5 text-xs text-fg transition-colors hover:bg-surface2">
                                  Publier
                                </button>
                              </form>
                            )}
                            <form action={deleteLabEntry}>
                              <input type="hidden" name="slug" value={doc.slug} />
                              <ConfirmSubmit
                                message={`Supprimer définitivement « ${title} » ?`}
                                className="rounded-md border border-red-500/40 px-2.5 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/10"
                              >
                                Supprimer
                              </ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
