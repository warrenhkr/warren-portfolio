import "server-only";
import { query } from "@/lib/db";
import { collectionSchemas, isCollection, validateVersion, type CollectionName } from "@/lib/content/schemas";

/**
 * Couche d'accès aux contenus (table `documents`).
 * Un document = une clé (collection, slug) et deux versions : `draft` et `published`.
 * Toute écriture passe par la validation Zod du schéma de la collection.
 */
export type VersionEnvelope = { v: number; visible: boolean; order: number; data: Record<string, unknown> };

export type DocumentRow = {
  collection: string;
  slug: string;
  draft: VersionEnvelope;
  published: VersionEnvelope | null;
  published_at: string | null;
  has_unpublished_changes: boolean;
  updated_at: string;
};

const COLUMNS = `collection, slug, draft, published, published_at, has_unpublished_changes, updated_at`;

export async function listDocuments(collection: CollectionName): Promise<DocumentRow[]> {
  return query<DocumentRow>(
    `select ${COLUMNS} from documents where collection = $1
      order by coalesce((draft->>'order')::int, 0), lower(draft #>> '{data,title,fr}'), slug`,
    [collection],
  );
}

export async function getDocument(collection: CollectionName, slug: string): Promise<DocumentRow | null> {
  const rows = await query<DocumentRow>(`select ${COLUMNS} from documents where collection = $1 and slug = $2 limit 1`, [collection, slug]);
  return rows[0] ?? null;
}

/** Contenus publiés et visibles, dans l'ordre défini par l'éditeur. */
export async function publishedDocuments(collection: CollectionName): Promise<{ slug: string; version: VersionEnvelope }[]> {
  const rows = await query<{ slug: string; published: VersionEnvelope }>(
    `select slug, published from documents
      where collection = $1 and published is not null and coalesce((published->>'visible')::boolean, true)
      order by coalesce((published->>'order')::int, 0), slug`,
    [collection],
  );
  return rows.map((r) => ({ slug: r.slug, version: r.published }));
}

/** Enregistre le brouillon. `has_unpublished_changes` compare brouillon et version publiée. */
export async function saveDraft(collection: CollectionName, slug: string, version: VersionEnvelope): Promise<void> {
  if (!isCollection(collection)) throw new Error(`Collection inconnue : ${collection}`);
  const valid = validateVersion(collection, version);
  // `has_unpublished_changes` est une colonne CALCULÉE par PostgreSQL : on ne l'écrit jamais.
  await query(
    `insert into documents (collection, slug, draft, created_at, updated_at)
     values ($1, $2, $3, now(), now())
     on conflict (collection, slug) do update
       set draft = excluded.draft, updated_at = now()`,
    [collection, slug, JSON.stringify(valid)],
  );
}

/** Publie le brouillon tel quel (refuse un brouillon invalide). */
export async function publishDocument(collection: CollectionName, slug: string): Promise<boolean> {
  const row = await getDocument(collection, slug);
  if (!row) throw new Error("Document introuvable.");
  validateVersion(collection, row.draft);
  const res = await query<{ slug: string }>(
    `update documents
        set published = draft, published_at = now(), updated_at = now()
      where collection = $1 and slug = $2
      returning slug`,
    [collection, slug],
  );
  return res.length > 0;
}

/** Retire un document de la publication sans le supprimer (le brouillon reste). */
export async function unpublishDocument(collection: CollectionName, slug: string): Promise<void> {
  await query(
    `update documents set published = null, published_at = null, updated_at = now()
      where collection = $1 and slug = $2`,
    [collection, slug],
  );
}

export async function setVisible(collection: CollectionName, slug: string, visible: boolean): Promise<void> {
  await query(
    `update documents
        set draft = jsonb_set(draft, '{visible}', to_jsonb($3::boolean)),
            published = case when published is null then null else jsonb_set(published, '{visible}', to_jsonb($3::boolean)) end,
            updated_at = now()
      where collection = $1 and slug = $2`,
    [collection, slug, visible],
  );
}

export async function deleteDocument(collection: CollectionName, slug: string): Promise<void> {
  await query(`delete from documents where collection = $1 and slug = $2`, [collection, slug]);
}

/** Prochain numéro d'ordre libre pour une collection (affichage). */
export async function nextOrder(collection: CollectionName): Promise<number> {
  const rows = await query<{ max: number | null }>(
    `select max(coalesce((draft->>'order')::int, 0)) as max from documents where collection = $1`,
    [collection],
  );
  return (rows[0]?.max ?? 0) + 1;
}

/** Compte les documents d'une collection (brouillons compris). */
export async function countDocuments(collection: CollectionName): Promise<number> {
  const rows = await query<{ n: number }>(`select count(*)::int as n from documents where collection = $1`, [collection]);
  return rows[0]?.n ?? 0;
}

export { collectionSchemas, isCollection };
export type { CollectionName };
