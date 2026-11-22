import "server-only";
import { isDbConfigured, query } from "@/lib/db";

/**
 * Statistiques du tableau de bord.
 *
 * Une seule série de requêtes : un test d'existence des tables (`to_regclass`)
 * puis UNE requête agrégée qui renvoie tous les compteurs, la dernière activité
 * et les migrations. Aucun N+1, aucun secret (pas d'URL, pas d'ip_hash).
 */

export type CollectionCount = { total: number; published: number; drafts: number };

export type ActivityEntry = {
  id: string;
  action: string;
  collection: string | null;
  label: string | null;
  at: string;
};

export type MigrationInfo = { version: string; name: string };

export type DashboardStats =
  | {
      ok: true;
      /** Durée de la requête agrégée seule. */
      latencyMs: number;
      /** Durée du test d'existence des tables (inclut l'ouverture de connexion si froide). */
      connectMs: number;
      collections: Record<string, CollectionCount>;
      media: { available: boolean; total: number };
      messages: { available: boolean; total: number; unread: number };
      activity: { available: boolean; entries: ActivityEntry[] };
      migrations: MigrationInfo[];
      /** Tables attendues mais absentes du schéma : la page le signale. */
      missingTables: string[];
    }
  | { ok: false; reason: "error"; code: string; latencyMs: number };

const COLLECTIONS = [
  "project",
  "skill",
  "tech",
  "ai_tool",
  "certification",
  "nav_link",
  "seo",
  "site",
  "social",
  "lab_entry",
] as const;

const zero = (): CollectionCount => ({ total: 0, published: 0, drafts: 0 });

type AggregateRow = {
  collections: Record<string, CollectionCount> | null;
  messages_total: number | null;
  messages_unread: number | null;
  media_total: number | null;
  activity: ActivityEntry[] | null;
  migrations: MigrationInfo[] | null;
};

type PresenceRow = {
  documents: boolean;
  messages: boolean;
  media: boolean;
  activity: boolean;
  schema_migrations: boolean;
};

/** 0 pour une collection absente de la table `documents` (ex. certification, lab_entry). */
function pick(collections: Record<string, CollectionCount>, key: string): CollectionCount {
  const value = collections[key];
  if (!value) return zero();
  return {
    total: Number(value.total ?? 0),
    published: Number(value.published ?? 0),
    drafts: Number(value.drafts ?? 0),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isDbConfigured()) return { ok: false, reason: "error", code: "non_configuree", latencyMs: 0 };

  const startedAt = Date.now();
  try {
    const probeStartedAt = Date.now();
    const presence = await query<PresenceRow>(
      `select
         to_regclass('public.documents') is not null         as documents,
         to_regclass('public.messages') is not null          as messages,
         to_regclass('public.media') is not null             as media,
         to_regclass('public.activity') is not null          as activity,
         to_regclass('public.schema_migrations') is not null as schema_migrations`,
    );
    const connectMs = Date.now() - probeStartedAt;
    const present = presence[0] ?? {
      documents: false, messages: false, media: false, activity: false, schema_migrations: false,
    };

    if (!present.documents) {
      return { ok: false, reason: "error", code: "table_documents_absente", latencyMs: Date.now() - startedAt };
    }

    const missingTables: string[] = [];
    if (!present.messages) missingTables.push("messages");
    if (!present.media) missingTables.push("media");
    if (!present.activity) missingTables.push("activity");
    if (!present.schema_migrations) missingTables.push("schema_migrations");

    const select: string[] = [
      `(select coalesce(json_object_agg(collection, json_build_object(
            'total', t, 'published', p, 'drafts', d)), '{}'::json)
          from (
            select collection,
                   count(*)::int                                          as t,
                   count(*) filter (where published is not null)::int      as p,
                   count(*) filter (where published is null)::int          as d
            from documents
            group by collection
          ) docs) as collections`,
    ];

    select.push(
      present.messages
        ? `(select count(*)::int from messages) as messages_total`
        : `null::int as messages_total`,
      present.messages
        ? `(select count(*)::int from messages where not is_read) as messages_unread`
        : `null::int as messages_unread`,
      present.media ? `(select count(*)::int from media) as media_total` : `null::int as media_total`,
      present.activity
        ? `(select coalesce(json_agg(a), '[]'::json) from (
             select id::text as id, action, collection, label, "at"
             from activity
             order by "at" desc
             limit 5
           ) a) as activity`
        : `null::json as activity`,
      present.schema_migrations
        ? `(select coalesce(json_agg(m), '[]'::json) from (
             select version, name from schema_migrations order by version
           ) m) as migrations`
        : `null::json as migrations`,
    );

    const queryStartedAt = Date.now();
    const rows = await query<AggregateRow>(`select ${select.join(",\n")}`);
    const row = rows[0];
    // Latence mesurée sur la requête agrégée elle-même, pas sur l'ouverture de connexion.
    const latencyMs = Date.now() - queryStartedAt;

    const raw = row?.collections ?? {};
    const collections: Record<string, CollectionCount> = {};
    for (const key of COLLECTIONS) collections[key] = pick(raw, key);

    const entries = Array.isArray(row?.activity) ? row!.activity : [];

    return {
      ok: true,
      latencyMs,
      connectMs,
      collections,
      media: { available: present.media, total: Number(row?.media_total ?? 0) },
      messages: {
        available: present.messages,
        total: Number(row?.messages_total ?? 0),
        unread: Number(row?.messages_unread ?? 0),
      },
      activity: {
        available: present.activity,
        entries: entries.map((entry) => ({
          id: String(entry.id),
          action: String(entry.action),
          collection: entry.collection ?? null,
          label: entry.label ?? null,
          at: new Date(entry.at).toISOString(),
        })),
      },
      migrations: Array.isArray(row?.migrations) ? row!.migrations : [],
      missingTables,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      code: (error as { code?: string }).code ?? "inconnu",
      latencyMs: Date.now() - startedAt,
    };
  }
}
