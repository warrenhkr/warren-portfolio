import "server-only";
import { isDbConfigured, query } from "@/lib/db";

export type SystemStatus =
  | { state: "unconfigured" }
  | { state: "error"; code: string }
  | { state: "ok"; migrations: { version: string; name: string }[]; collections: { collection: string; total: number; unpublished: number }[] };

/** État réel de la connexion et du schéma (aucun détail de connexion n'est renvoyé). */
export async function getSystemStatus(): Promise<SystemStatus> {
  if (!isDbConfigured()) return { state: "unconfigured" };
  try {
    const migrations = await query<{ version: string; name: string }>("select version, name from schema_migrations order by version");
    const collections = await query<{ collection: string; total: number; unpublished: number }>(
      "select collection, count(*)::int as total, (count(*) filter (where has_unpublished_changes))::int as unpublished from documents group by collection order by collection");
    return { state: "ok", migrations, collections };
  } catch (e) {
    return { state: "error", code: (e as { code?: string }).code ?? "inconnu" };
  }
}
