import "server-only";
import { query } from "@/lib/db";

/**
 * Accès aux messages du formulaire de contact (table `messages`).
 *
 * Toutes les requêtes sont paramétrées : aucun identifiant, filtre ou terme de
 * recherche n'est concaténé dans le SQL. Le filtre `is_read` et la recherche
 * `ilike` passent par des paramètres liés ($n), jamais par interpolation.
 */

export type MessageFilter = "all" | "unread" | "read";

export const FILTERS: MessageFilter[] = ["all", "unread", "read"];

export type MessageSummary = {
  id: string;
  name: string;
  email: string;
  subject: string;
  is_read: boolean;
  created_at: string;
};

export type MessageDetail = MessageSummary & { body: string };

export type MessageCounts = { total: number; unread: number };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un identifiant qui n'est pas un uuid ne doit jamais atteindre la base. */
export function isMessageId(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseFilter(value: string | undefined): MessageFilter {
  return value === "unread" || value === "read" ? value : "all";
}

/** Terme de recherche borné : la requête reste courte quel que soit l'URL fournie. */
export function parseSearch(value: string | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

/**
 * Motif `ilike` à partir d'une saisie libre : on neutralise `%`, `_` et `\`
 * pour qu'ils restent des caractères littéraux et non des jokers.
 */
function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function isoDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

type Row = {
  id: string;
  name: string;
  email: string;
  subject: string;
  is_read: boolean;
  created_at: string | Date;
};

function toSummary(row: Row): MessageSummary {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    subject: row.subject,
    is_read: Boolean(row.is_read),
    created_at: isoDate(row.created_at),
  };
}

export async function getMessageCounts(): Promise<MessageCounts> {
  const rows = await query<{ total: number; unread: number }>(
    `select count(*)::int as total,
            count(*) filter (where not is_read)::int as unread
       from public.messages`,
  );
  return { total: Number(rows[0]?.total ?? 0), unread: Number(rows[0]?.unread ?? 0) };
}

export async function listMessages(options: { filter: MessageFilter; search: string }): Promise<MessageSummary[]> {
  const pattern = options.search ? likePattern(options.search) : null;
  const filter = options.filter === "all" ? null : options.filter === "unread" ? "unread" : "read";

  const rows = await query<Row>(
    `select id::text as id, name, email, subject, is_read, created_at
       from public.messages
      where ($1::text is null or name ilike $1 or email ilike $1 or subject ilike $1)
        and ($2::text is null
             or ($2 = 'unread' and not is_read)
             or ($2 = 'read' and is_read))
      order by is_read asc, created_at desc
      limit 200`,
    [pattern, filter],
  );
  return rows.map(toSummary);
}

export async function getMessage(id: string): Promise<MessageDetail | null> {
  if (!isMessageId(id)) return null;
  const rows = await query<Row & { body: string }>(
    `select id::text as id, name, email, subject, body, is_read, created_at
       from public.messages
      where id = $1::uuid
      limit 1`,
    [id],
  );
  const row = rows[0];
  return row ? { ...toSummary(row), body: row.body } : null;
}

/** Retourne `true` seulement si l'état a réellement changé. */
export async function markMessageRead(id: string, read: boolean): Promise<boolean> {
  if (!isMessageId(id)) return false;
  const rows = await query<{ id: string }>(
    `update public.messages
        set is_read = $2
      where id = $1::uuid
        and is_read is distinct from $2
      returning id::text as id`,
    [id, read],
  );
  return rows.length > 0;
}

export type DeletedMessage = { id: string; name: string; email: string; subject: string };

export async function deleteMessageById(id: string): Promise<DeletedMessage | null> {
  if (!isMessageId(id)) return null;
  const rows = await query<DeletedMessage>(
    `delete from public.messages where id = $1::uuid returning id::text as id, name, email, subject`,
    [id],
  );
  return rows[0] ?? null;
}
