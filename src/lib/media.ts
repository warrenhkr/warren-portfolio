import "server-only";
import { query } from "./db";

/**
 * Médiathèque : fichiers stockés dans Supabase Storage (bucket public `media`),
 * métadonnées dans la table `media` de ce projet.
 *
 * Règles tenues ici :
 *  - l'URL du projet Supabase est DÉDUITE de `DATABASE_URL` (utilisateur `postgres.<ref>`) :
 *    une variable de moins à recopier, et jamais de valeur affichée ;
 *  - l'écriture (envoi, suppression) exige `SUPABASE_SERVICE_ROLE_KEY` : sans elle, l'écran
 *    explique ce qui manque au lieu d'échouer en silence ;
 *  - la clé ne quitte jamais le serveur (aucun `NEXT_PUBLIC_`).
 */

export const BUCKET = "media";
export const MAX_BYTES = 5 * 1024 * 1024;
export const MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;

/** `https://<ref>.supabase.co`, déduit de l'utilisateur du pooler. */
export function projectUrl(): string | null {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;
  try {
    const user = decodeURIComponent(new URL(raw).username);
    const ref = user.includes(".") ? user.split(".").pop() : null;
    if (!ref || !/^[a-z]{20}$/.test(ref)) return null;
    return `https://${ref}.supabase.co`;
  } catch {
    return null;
  }
}

export const isStorageConfigured = (): boolean => Boolean(projectUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** URL publique d'un fichier (le bucket est public : lecture sans clé, cache CDN). */
export function publicUrl(storagePath: string): string {
  const base = projectUrl();
  if (!base) return "";
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
}

export type MediaItem = {
  id: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: { fr: string; en: string };
  folder: string;
  createdAt: string;
  url: string;
  /** Nombre de documents qui référencent ce média (brouillon ou version publiée). */
  usage: number;
};

type Row = {
  id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt: { fr?: string; en?: string } | null;
  folder: string;
  created_at: string;
  usage: number;
};

/** Compte les documents qui citent l'identifiant du média, dans le brouillon comme dans le publié. */
const USAGE_SQL = `
  (select count(*)::int from documents d
    where d.draft::text like '%' || m.id::text || '%'
       or (d.published is not null and d.published::text like '%' || m.id::text || '%'))`;

const COLUMNS = `m.id, m.storage_path, m.filename, m.mime_type, m.size_bytes, m.width, m.height, m.alt, m.folder, m.created_at, ${USAGE_SQL} as usage`;

const toItem = (row: Row): MediaItem => ({
  id: row.id,
  storagePath: row.storage_path,
  filename: row.filename,
  mimeType: row.mime_type,
  sizeBytes: Number(row.size_bytes),
  width: row.width,
  height: row.height,
  alt: { fr: row.alt?.fr ?? "", en: row.alt?.en ?? "" },
  folder: row.folder,
  createdAt: new Date(row.created_at).toISOString(),
  url: publicUrl(row.storage_path),
  usage: Number(row.usage ?? 0),
});

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await query<Row>(`select ${COLUMNS} from media m order by m.created_at desc`);
  return rows.map(toItem);
}

export async function getMedia(id: string): Promise<MediaItem | null> {
  const rows = await query<Row>(`select ${COLUMNS} from media m where m.id = $1`, [id]);
  return rows[0] ? toItem(rows[0]) : null;
}

const folderOf = (folder: string) => {
  const clean = folder.trim().toLowerCase().replace(/[^a-z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "");
  return clean.slice(0, 60);
};

/** Nom de fichier sûr : pas d'accent, pas d'espace, extension conservée. */
const safeName = (name: string) => {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "fichier";
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  return `${base}.${ext}`;
};

export type UploadResult = { ok: true; item: MediaItem } | { ok: false; error: string };

/**
 * Envoie un fichier dans le bucket puis enregistre sa ligne dans `media`.
 * Si l'enregistrement en base échoue après l'envoi, le fichier est retiré du bucket :
 * pas de fichier orphelin, pas de ligne fantôme.
 */
export async function uploadMedia(file: File, options: { folder: string; alt: { fr: string; en: string } }): Promise<UploadResult> {
  const base = projectUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Médiathèque non configurée (SUPABASE_SERVICE_ROLE_KEY absente)." };

  if (!MIME_TYPES.includes(file.type as (typeof MIME_TYPES)[number])) {
    return { ok: false, error: `Format refusé (${file.type || "inconnu"}). Autorisés : JPEG, PNG, WebP, AVIF, GIF.` };
  }
  if (file.size === 0) return { ok: false, error: "Fichier vide." };
  if (file.size > MAX_BYTES) return { ok: false, error: `Fichier trop lourd (${Math.round(file.size / 1024)} ko). Maximum 5 Mo.` };

  const folder = folderOf(options.folder);
  const filename = safeName(file.name);
  // Préfixe unique : deux fichiers de même nom ne s'écrasent jamais.
  const storagePath = `${folder ? `${folder}/` : ""}${Date.now().toString(36)}-${filename}`;

  const upload = await fetch(`${base}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": file.type,
      "x-upsert": "false",
      "cache-control": "public, max-age=31536000, immutable",
    },
    body: new Uint8Array(await file.arrayBuffer()),
  });

  if (!upload.ok) {
    const detail = await upload.text().catch(() => "");
    console.error("[media] envoi refusé :", upload.status, detail.slice(0, 200));
    return { ok: false, error: `Envoi refusé par le stockage (${upload.status}).` };
  }

  try {
    const rows = await query<Row>(
      `insert into media (storage_path, filename, mime_type, size_bytes, alt, folder)
       values ($1, $2, $3, $4, $5, $6)
       returning id, storage_path, filename, mime_type, size_bytes, width, height, alt, folder, created_at, 0 as usage`,
      [storagePath, filename, file.type, file.size, JSON.stringify(options.alt), folder],
    );
    return { ok: true, item: toItem(rows[0]) };
  } catch (error) {
    await fetch(`${base}/storage/v1/object/${BUCKET}/${storagePath}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}` },
    }).catch(() => undefined);
    const message = error instanceof Error ? error.message : "échec inconnu";
    return { ok: false, error: `Enregistrement impossible : ${message.slice(0, 120)}` };
  }
}

/** Met à jour le texte alternatif (bilingue) d'un média. */
export async function saveAlt(id: string, alt: { fr: string; en: string }): Promise<void> {
  await query(`update media set alt = $2 where id = $1`, [id, JSON.stringify(alt)]);
}

/** Supprime le fichier du bucket puis la ligne. Refuse si un document l'utilise encore. */
export async function deleteMedia(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const item = await getMedia(id);
  if (!item) return { ok: false, error: "Ce média n'existe plus." };
  if (item.usage > 0) {
    return { ok: false, error: `Utilisé par ${item.usage} document(s) : retirez-le d'abord de leur contenu.` };
  }

  const base = projectUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (base && key) {
    const res = await fetch(`${base}/storage/v1/object/${BUCKET}/${item.storagePath}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}` },
    });
    // 404 = fichier déjà absent : la ligne doit quand même partir.
    if (!res.ok && res.status !== 404) {
      console.error("[media] suppression du fichier refusée :", res.status);
      return { ok: false, error: `Le stockage a refusé la suppression (${res.status}).` };
    }
  }

  await query(`delete from media where id = $1`, [id]);
  return { ok: true };
}
