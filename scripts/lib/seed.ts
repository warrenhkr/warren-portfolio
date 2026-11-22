import { readFileSync } from "node:fs";
import type { Client } from "pg";
import { Slug, validateVersion } from "../../src/lib/content/schemas";

type SeedDoc = { collection: string; slug: string; visible: boolean; order: number; data: unknown };

export function loadSeed(file: string): SeedDoc[] {
  const json = JSON.parse(readFileSync(file, "utf8")) as { version: number; documents: SeedDoc[] };
  if (json.version !== 1 || !Array.isArray(json.documents)) throw new Error("Fichier de seed invalide.");
  return json.documents;
}

/**
 * Importe le contenu initial. Idempotent et non destructif : un document déjà présent
 * (donc éventuellement modifié depuis l'ADMIN) n'est JAMAIS écrasé.
 * Le contenu importé est celui qui est déjà public aujourd'hui : brouillon = publié.
 */
export async function seed(client: Client, docs: SeedDoc[]): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  await client.query("begin");
  try {
    for (const d of docs) {
      Slug.parse(d.slug);
      const version = validateVersion(d.collection, { v: 1, visible: d.visible, order: d.order, data: d.data });
      const r = await client.query(
        `insert into documents (collection, slug, draft, published, published_at)
         values ($1, $2, $3::jsonb, $3::jsonb, now()) on conflict (collection, slug) do nothing`,
        [d.collection, d.slug, JSON.stringify(version)],
      );
      inserted += r.rowCount ?? 0;
    }
    if (inserted > 0) await client.query("insert into activity (action, label, details) values ('seed', $1, $2)", ["Import du contenu initial", JSON.stringify({ inserted })]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
  return { inserted, skipped: docs.length - inserted };
}
