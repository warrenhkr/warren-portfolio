import { requireAdmin } from "@/lib/auth/guard";
import { PageHeader, Panel, Badge, EmptyState } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { deleteMessage, setMessageRead } from "./actions";
import { getMessageCounts, listMessages, parseFilter, parseSearch, type MessageFilter } from "./queries";
import { relativeFr, absoluteFr } from "./format";

export const dynamic = "force-dynamic";

const TABS: Array<{ id: MessageFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "unread", label: "Non lus" },
  { id: "read", label: "Lus" },
];

function buildUrl(filter: MessageFilter, search: string): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("f", filter);
  if (search) params.set("q", search);
  const query = params.toString();
  return query ? `/admin/messages?${query}` : "/admin/messages";
}

const TAB_CLASS = (active: boolean) =>
  [
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-[rgb(var(--accent))]/50 bg-[rgb(var(--accent))]/[0.12] text-fg"
      : "border-line bg-surface text-muted hover:bg-surface2 hover:text-fg",
  ].join(" ");

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { f?: string; q?: string; ok?: string; e?: string };
}) {
  await requireAdmin();

  const filter = parseFilter(searchParams.f);
  const search = parseSearch(searchParams.q);
  const listUrl = buildUrl(filter, search);

  let counts = { total: 0, unread: 0 };
  let messages: Awaited<ReturnType<typeof listMessages>> = [];
  let failure: string | null = null;

  try {
    [counts, messages] = await Promise.all([getMessageCounts(), listMessages({ filter, search })]);
  } catch (error) {
    failure = error instanceof Error ? error.message.slice(0, 160) : "erreur inconnue";
  }

  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Messages"
        description="Messages reçus via le formulaire de contact. Ouvrir un message le marque automatiquement comme lu."
        meta={
          failure ? null : (
            <>
              <Badge tone={counts.unread > 0 ? "warn" : "ok"}>
                {counts.unread > 0
                  ? `${counts.unread} non lu${counts.unread > 1 ? "s" : ""}`
                  : "tout est lu"}
              </Badge>
              <span className="text-xs text-muted">
                {counts.total} message{counts.total > 1 ? "s" : ""} au total
              </span>
            </>
          )
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

        {failure ? (
          <Panel title="Base de données indisponible">
            <p className="text-sm leading-relaxed text-muted">
              La table <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">messages</code> n’a pas pu être
              interrogée. Aucun message n’est affiché plutôt que d’afficher une liste inventée.
            </p>
            <p className="mt-2 font-mono text-xs text-muted">{failure}</p>
          </Panel>
        ) : (
          <Panel padded={false} title={`${messages.length} message${messages.length > 1 ? "s" : ""} affiché${messages.length > 1 ? "s" : ""}`}>
            <div className="space-y-3 border-b border-line px-3 py-3 sm:px-4">
              <div className="flex flex-wrap items-center gap-2">
                {TABS.map((tab) => {
                  const active = tab.id === filter;
                  const count = tab.id === "all" ? counts.total : tab.id === "unread" ? counts.unread : counts.total - counts.unread;
                  return (
                    <a key={tab.id} href={buildUrl(tab.id, search)} aria-current={active ? "page" : undefined} className={TAB_CLASS(active)}>
                      {tab.label}
                      <span className="tabular-nums text-[11px] text-muted">{count}</span>
                    </a>
                  );
                })}
              </div>

              <form method="get" action="/admin/messages" className="flex flex-wrap items-center gap-2">
                {filter !== "all" && <input type="hidden" name="f" value={filter} />}
                <label htmlFor="messages-search" className="sr-only">
                  Rechercher par nom, e-mail ou sujet
                </label>
                <input
                  id="messages-search"
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Nom, e-mail ou sujet…"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-[13px] text-fg outline-none transition-colors placeholder:text-muted/70 focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/[0.18] sm:max-w-72"
                />
                <button
                  type="submit"
                  className="h-9 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-fg transition-colors hover:bg-surface2"
                >
                  Rechercher
                </button>
                {search && (
                  <a href={buildUrl(filter, "")} className="text-xs text-muted underline-offset-2 hover:text-fg hover:underline">
                    Effacer
                  </a>
                )}
              </form>
            </div>

            {messages.length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyState
                  bare
                  title={search ? "Aucun message ne correspond" : filter === "unread" ? "Aucun message non lu" : filter === "read" ? "Aucun message lu" : "Boîte de réception vide"}
                  text={
                    search
                      ? `Aucun nom, e-mail ou sujet ne contient « ${search} ».`
                      : filter === "all"
                        ? "Les messages envoyés via le formulaire de contact apparaîtront ici."
                        : "Changez de filtre pour voir les autres messages."
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">Messages reçus</caption>
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.08em] text-muted">
                      <th scope="col" className="py-2.5 pl-4 pr-4 font-semibold sm:pl-5">Expéditeur</th>
                      <th scope="col" className="py-2.5 pr-4 font-semibold">Sujet</th>
                      <th scope="col" className="hidden py-2.5 pr-4 font-semibold md:table-cell">Reçu</th>
                      <th scope="col" className="py-2.5 pr-4 font-semibold">État</th>
                      <th scope="col" className="py-2.5 pr-4 text-right font-semibold sm:pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => {
                      const unread = !message.is_read;
                      return (
                        <tr
                          key={message.id}
                          className={`border-b border-line/60 align-top last:border-0 ${unread ? "bg-[rgb(var(--accent))]/[0.05]" : ""}`}
                        >
                          <td className="py-3 pl-4 pr-4 sm:pl-5">
                            <div className="flex items-start gap-2">
                              <span
                                aria-hidden="true"
                                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${unread ? "bg-[rgb(var(--accent))]" : "bg-transparent"}`}
                              />
                              <div className="min-w-0">
                                <p className={`truncate ${unread ? "font-semibold text-fg" : "text-fg"}`}>{message.name}</p>
                                <p className="truncate font-mono text-[11px] text-muted">{message.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[22rem] py-3 pr-4">
                            <a
                              href={`/admin/messages/${message.id}?back=${encodeURIComponent(listUrl)}`}
                              className={`block truncate hover:underline ${unread ? "font-semibold text-fg" : "text-fg/90"}`}
                            >
                              {message.subject}
                            </a>
                            {unread && <span className="sr-only">(non lu)</span>}
                          </td>
                          <td className="hidden whitespace-nowrap py-3 pr-4 text-muted md:table-cell" title={absoluteFr(message.created_at)}>
                            <span className="text-xs">{relativeFr(message.created_at, now)}</span>
                          </td>
                          <td className="py-3 pr-4">
                            {unread ? <Badge tone="warn">Non lu</Badge> : <Badge tone="neutral">Lu</Badge>}
                          </td>
                          <td className="py-3 pr-4 sm:pr-5">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <a
                                href={`/admin/messages/${message.id}?back=${encodeURIComponent(listUrl)}`}
                                className="rounded-md border border-line px-2.5 py-1.5 text-xs text-fg transition-colors hover:bg-surface2"
                              >
                                Ouvrir
                              </a>
                              <form action={setMessageRead}>
                                <input type="hidden" name="id" value={message.id} />
                                <input type="hidden" name="back" value={listUrl} />
                                <input type="hidden" name="read" value={unread ? "true" : "false"} />
                                <button
                                  type="submit"
                                  className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-surface2 hover:text-fg"
                                >
                                  {unread ? "Marquer lu" : "Marquer non lu"}
                                </button>
                              </form>
                              <form action={deleteMessage}>
                                <input type="hidden" name="id" value={message.id} />
                                <input type="hidden" name="back" value={listUrl} />
                                <ConfirmSubmit
                                  message={`Supprimer définitivement le message de ${message.name} (« ${message.subject} ») ?`}
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
        )}
      </div>
    </>
  );
}
