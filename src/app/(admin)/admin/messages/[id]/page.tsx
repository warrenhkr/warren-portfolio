import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { PageHeader, Panel, Badge } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { getMessage, markMessageRead } from "../queries";
import { relativeFr, absoluteFr } from "../format";
import { deleteMessage, setMessageRead } from "../actions";

export const dynamic = "force-dynamic";

const RETURN_RE = /^\/admin\/messages(?:\?[^\s#]*)?$/;

export default async function MessageDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { back?: string; ok?: string; e?: string };
}) {
  await requireAdmin();

  const message = await getMessage(params.id);
  if (!message) notFound();

  const back = searchParams.back && RETURN_RE.test(searchParams.back) ? searchParams.back : "/admin/messages";

  // Ouvrir un message le marque lu. On ne journalise que la transition réelle
  // (message non lu → lu), pas chaque rechargement de la page.
  if (!message.is_read) {
    const changed = await markMessageRead(message.id, true);
    if (changed) await logActivity("message.read", "Messages", { id: message.id });
  }

  const mailto = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`;

  return (
    <>
      <PageHeader
        eyebrow="Message reçu"
        title={message.subject}
        description={`De ${message.name} · ${message.email}`}
        meta={
          <>
            {message.is_read ? <Badge tone="neutral">Lu</Badge> : <Badge tone="warn">Non lu</Badge>}
            <span className="text-xs text-muted" title={absoluteFr(message.created_at)}>
              Reçu {relativeFr(message.created_at)} — {absoluteFr(message.created_at)}
            </span>
          </>
        }
        actions={
          <>
            <a
              href={mailto}
              className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--btn))] px-3.5 py-2 text-sm font-semibold text-[rgb(var(--btn-ink))] transition-colors hover:bg-[rgb(var(--btn-hover))]"
            >
              Répondre par e-mail
            </a>
            <Link
              href={back}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface2"
            >
              Retour à la liste
            </Link>
          </>
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

        <Panel title="Contenu du message" actions={<span className="font-mono text-[11px] text-muted">#{message.id.slice(0, 8)}</span>}>
          <div className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-fg">{message.body}</div>
        </Panel>

        <Panel title="Expéditeur">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-muted">Nom</dt>
              <dd className="mt-1 text-fg">{message.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-muted">E-mail</dt>
              <dd className="mt-1">
                <a href={mailto} className="break-all font-mono text-[13px] text-fg underline-offset-2 hover:underline">
                  {message.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-muted">Sujet</dt>
              <dd className="mt-1 text-fg">{message.subject}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-muted">Reçu le</dt>
              <dd className="mt-1 tabular-nums text-fg">{absoluteFr(message.created_at)}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <form action={setMessageRead}>
              <input type="hidden" name="id" value={message.id} />
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="read" value={message.is_read ? "false" : "true"} />
              <button
                type="submit"
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface2"
              >
                {message.is_read ? "Marquer comme non lu" : "Marquer comme lu"}
              </button>
            </form>
            <form action={deleteMessage}>
              <input type="hidden" name="id" value={message.id} />
              <input type="hidden" name="back" value={back} />
              <ConfirmSubmit
                message={`Supprimer définitivement le message de ${message.name} (« ${message.subject} ») ?`}
                className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10"
              >
                Supprimer le message
              </ConfirmSubmit>
            </form>
          </div>
        </Panel>
      </div>
    </>
  );
}
