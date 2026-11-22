import { z } from "zod";

/**
 * Schémas de validation du contenu (appliqués côté serveur, jamais seulement dans le navigateur).
 * Chaque document en base est une « version » : { v, visible, order, data } — même enveloppe pour le brouillon et le publié.
 */
const text = (max: number) => z.string().max(max);
export const L = z.object({ fr: text(5000), en: text(5000) }).strict();
export const MediaRef = z.string().uuid();
export const Category = z.enum(["hardware", "software"]);
const HttpUrl = z.string().max(500).url().refine((u) => /^https?:\/\//i.test(u), "Seules les URL http(s) sont autorisées.");
const OptionalUrl = z.union([z.literal(""), HttpUrl]);
const IconKey = z.string().regex(/^[a-z0-9-]{1,40}$/);

export const Project = z.object({
  title: L,
  category: Category,
  summary: L.optional(),
  image: MediaRef.nullable().optional(),
  tech: z.array(text(60)).max(30),
  description: L.optional(),
  problem: L.optional(),
  goals: z.array(L).max(20).optional(),
  solution: L.optional(),
  role: L.optional(),
  results: L.optional(),
  gallery: z.array(z.object({ media: MediaRef, alt: L }).strict()).max(40).optional(),
  videos: z.array(z.object({ url: HttpUrl, label: L }).strict()).max(20).optional(),
  links: z.object({ github: OptionalUrl.optional(), demo: OptionalUrl.optional() }).strict().optional(),
}).strict();

export const Skill = z.object({ category: Category, icon: IconKey, name: L, text: L }).strict();
export const Tech = z.object({ name: text(60), icon: IconKey.optional(), category: Category, status: z.enum(["used", "exploring", "unconfirmed"]) }).strict();
export const AiTool = z.object({ name: text(60), icon: IconKey.optional(), url: HttpUrl, role: L, text: L, usage: z.enum(["regular", "experiment", "unconfirmed"]) }).strict();
export const NavLink = z.object({ label: L, href: z.string().regex(/^\/[a-z0-9\-/]*$/).max(100) }).strict();
export const Social = z.object({ label: text(40), platform: IconKey, url: OptionalUrl }).strict();
export const Site = z.object({ name: text(80), email: z.union([z.literal(""), z.string().email().max(200)]) }).strict();
export const Seo = z.object({ title: L, description: L, ogImage: MediaRef.nullable().optional() }).strict();

/** Une entrée du Lab : expérimentation, prototype, test, concept, POC ou exploration. */
export const LabEntry = z
  .object({
    kind: z.enum(["experiment", "prototype", "test", "concept", "poc", "exploration"]),
    category: Category,
    title: L,
    text: L,
    tech: z.array(z.string().max(40)).max(20).optional(),
    link: OptionalUrl.optional(),
  })
  .strict();

/** Certification, attestation, formation ou diplôme réellement obtenu. */
export const Certification = z
  .object({
    title: L,
    issuer: z.string().max(120),
    year: z.string().max(20),
  })
  .strict();

export const collectionSchemas = {
  project: Project,
  skill: Skill,
  tech: Tech,
  ai_tool: AiTool,
  nav_link: NavLink,
  social: Social,
  site: Site,
  seo: Seo,
  lab_entry: LabEntry,
  certification: Certification,
} as const;
export type CollectionName = keyof typeof collectionSchemas;
export const isCollection = (name: string): name is CollectionName => Object.hasOwn(collectionSchemas, name);

export const Slug = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,80}$/);

export const versionOf = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ v: z.literal(1), visible: z.boolean(), order: z.number().int().min(0).max(100000), data }).strict();

/** Valide une version complète d'un document ; lève une erreur lisible sinon. */
export function validateVersion(collection: string, value: unknown) {
  if (!isCollection(collection)) throw new Error(`Collection inconnue : ${collection}`);
  const result = versionOf(collectionSchemas[collection]).safeParse(value);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join(".") || "(racine)"} : ${i.message}`).join(" ; ");
    throw new Error(`Contenu invalide pour « ${collection} » — ${detail}`);
  }
  return result.data;
}

/** Identifiants de médias référencés par un contenu (sert à tenir à jour la table document_media). */
export function mediaIdsOf(collection: CollectionName, data: unknown): string[] {
  const d = data as Record<string, unknown>;
  const ids: unknown[] = [];
  if (collection === "project") {
    ids.push(d.image);
    for (const g of (d.gallery as { media: string }[] | undefined) ?? []) ids.push(g.media);
  }
  if (collection === "seo") ids.push(d.ogImage);
  return [...new Set(ids.filter((x): x is string => typeof x === "string"))];
}
