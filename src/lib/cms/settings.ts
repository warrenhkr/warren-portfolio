import "server-only";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  nextOrder,
  publishDocument,
  saveDraft,
  type DocumentRow,
  type VersionEnvelope,
} from "./documents";
import { transaction } from "@/lib/db";
import { seoDescriptions, seoDescriptionsEn } from "@/content/copy";
import { nav as navFile, site as siteFile } from "@/content/site";
import { Slug } from "@/lib/content/schemas";

/**
 * Réglages du site (collections `site`, `seo`, `nav_link`, `social`).
 *
 * Règles tenues ici :
 *  - lecture : la base fait foi, les fichiers `src/content` servent de repli (jamais d'écran vide) ;
 *  - écriture : toujours `saveDraft`, donc toujours validée par le schéma Zod de la collection ;
 *  - aucun document existant n'est modifié hors d'une soumission de formulaire explicite.
 *
 * Le document `site` est unique (slug `main`). Le SEO est stocké un document par page
 * (un slug par route publique) : c'est la forme réellement utilisée par la base.
 */
export const SETTINGS_SLUG = "main";

export type Bilingual = { fr: string; en: string };
/** D'où viennent les valeurs affichées : base de données ou fichiers de contenu. */
export type SettingsSource = "base" | "fichiers";

export type SiteSettings = { name: string; email: string };

/** Routes publiques dont le SEO est éditable, dans l'ordre du menu. */
export const SEO_ROUTES = [
  { slug: "home", path: "/", label: "Accueil" },
  { slug: "about", path: "/about", label: "À propos" },
  { slug: "projects", path: "/projects", label: "Projets" },
  { slug: "lab", path: "/lab", label: "Lab" },
  { slug: "skills", path: "/skills", label: "Compétences" },
  { slug: "stack", path: "/stack", label: "Ma stack" },
  { slug: "ai-workspace", path: "/ai-workspace", label: "Espace IA" },
  { slug: "contact", path: "/contact", label: "Contact" },
];

const textOf = (value: unknown): string => (typeof value === "string" ? value : "");

const bilingualOf = (value: unknown): Bilingual => {
  const v = (value ?? {}) as { fr?: unknown; en?: unknown };
  return { fr: textOf(v.fr), en: textOf(v.en) };
};

/** Repli fichier pour une page : libellé du menu + descriptions de `src/content/copy`. */
function fallbackSeo(slug: string): { title: Bilingual; description: Bilingual } {
  const nav = navFile.find((item) => (item.href === "/" ? "home" : item.href.replace(/^\//, "")) === slug);
  // La copie de secours nomme « ai » la page « ai-workspace ».
  const key = (slug === "ai-workspace" ? "ai" : slug) as keyof typeof seoDescriptions;
  return {
    title: slug === "home" ? { fr: siteFile.name, en: siteFile.name } : { fr: nav?.label.fr ?? "", en: nav?.label.en ?? "" },
    description: { fr: seoDescriptions[key] ?? "", en: seoDescriptionsEn[key as keyof typeof seoDescriptionsEn] ?? "" },
  };
}

export type SiteSettingsRead = {
  values: SiteSettings;
  doc: DocumentRow | null;
  source: SettingsSource;
};

/** Valeurs actuelles du document `site/main` (repli sur `src/content/site.ts`). */
export async function readSiteSettings(): Promise<SiteSettingsRead> {
  try {
    const doc = await getDocument("site", SETTINGS_SLUG);
    if (!doc) return { values: { name: siteFile.name, email: siteFile.email }, doc: null, source: "fichiers" };
    return {
      values: { name: textOf(doc.draft.data.name), email: textOf(doc.draft.data.email) },
      doc,
      source: "base",
    };
  } catch (error) {
    console.error("[cms] réglages du site illisibles, repli sur les fichiers :", error instanceof Error ? error.message : error);
    return { values: { name: siteFile.name, email: siteFile.email }, doc: null, source: "fichiers" };
  }
}

export type SeoPage = {
  slug: string;
  /** Adresse publique (vide si le document ne correspond à aucune route connue). */
  path: string;
  label: string;
  title: Bilingual;
  description: Bilingual;
  order: number;
  doc: DocumentRow | null;
};

export type SeoPagesRead = { pages: SeoPage[]; source: SettingsSource };

/** Une entrée par page publique, plus tout document SEO existant hors routes connues. */
export async function readSeoPages(): Promise<SeoPagesRead> {
  let docs: DocumentRow[] = [];
  let source: SettingsSource = "base";
  try {
    docs = await listDocuments("seo");
  } catch (error) {
    console.error("[cms] SEO illisible, repli sur les fichiers :", error instanceof Error ? error.message : error);
    source = "fichiers";
  }

  const bySlug = new Map(docs.map((doc) => [doc.slug, doc] as const));

  const pages: SeoPage[] = SEO_ROUTES.map((route) => {
    const doc = bySlug.get(route.slug) ?? null;
    bySlug.delete(route.slug);
    const fallback = fallbackSeo(route.slug);
    return {
      slug: route.slug,
      path: route.path,
      label: route.label,
      title: doc ? bilingualOf(doc.draft.data.title) : fallback.title,
      description: doc ? bilingualOf(doc.draft.data.description) : fallback.description,
      order: doc?.draft.order ?? 0,
      doc,
    };
  });

  for (const doc of bySlug.values()) {
    pages.push({
      slug: doc.slug,
      path: doc.slug === SETTINGS_SLUG ? "" : `/${doc.slug}`,
      label: doc.slug,
      title: bilingualOf(doc.draft.data.title),
      description: bilingualOf(doc.draft.data.description),
      order: doc.draft.order,
      doc,
    });
  }

  return { pages, source };
}

/** Enregistre le document `site/main` (nom + e-mail). Zod valide dans `saveDraft`. */
export async function saveSiteSettings(values: SiteSettings): Promise<void> {
  const current = await getDocument("site", SETTINGS_SLUG).catch(() => null);
  const version: VersionEnvelope = {
    v: 1,
    visible: current?.draft.visible ?? true,
    order: current?.draft.order ?? 0,
    data: { name: values.name, email: values.email },
  };
  await saveDraft("site", SETTINGS_SLUG, version);
}

/**
 * Enregistre le SEO d'une page. `ogImage` n'est pas édité par l'écran :
 * s'il existe déjà, il est recopié pour ne jamais le perdre.
 */
export async function saveSeoPage(
  slug: string,
  values: { title: Bilingual; description: Bilingual },
): Promise<void> {
  if (!Slug.safeParse(slug).success) throw new Error(`Identifiant de page invalide : « ${slug} ».`);

  const current = await getDocument("seo", slug).catch(() => null);
  const existing = (current?.draft.data ?? {}) as Record<string, unknown>;
  const data: Record<string, unknown> = { title: values.title, description: values.description };
  if (typeof existing.ogImage === "string" && existing.ogImage) data.ogImage = existing.ogImage;

  const knownIndex = SEO_ROUTES.findIndex((route) => route.slug === slug);
  const version: VersionEnvelope = {
    v: 1,
    visible: current?.draft.visible ?? true,
    order: current?.draft.order ?? (knownIndex >= 0 ? knownIndex : 0),
    data,
  };
  await saveDraft("seo", slug, version);
}

export type NavItem = {
  slug: string;
  label: Bilingual;
  href: string;
  order: number;
  visible: boolean;
  published: boolean;
  hasPending: boolean;
};

export type NavRead = { items: NavItem[]; source: SettingsSource };

/** Liens de navigation, dans l'ordre d'affichage (repli sur `src/content/site.ts`). */
export async function readNavLinks(): Promise<NavRead> {
  try {
    const docs = await listDocuments("nav_link");
    if (docs.length === 0) throw new Error("collection nav_link vide");
    return {
      source: "base",
      items: docs.map((doc) => ({
        slug: doc.slug,
        label: bilingualOf(doc.draft.data.label),
        href: textOf(doc.draft.data.href),
        order: doc.draft.order,
        visible: doc.draft.visible,
        published: Boolean(doc.published),
        hasPending: Boolean(doc.has_unpublished_changes),
      })),
    };
  } catch (error) {
    console.error("[cms] navigation illisible, repli sur les fichiers :", error instanceof Error ? error.message : error);
    return {
      source: "fichiers",
      items: navFile.map((item, index) => ({
        slug: item.href === "/" ? "home" : item.href.replace(/^\//, ""),
        label: { fr: item.label.fr, en: item.label.en },
        href: item.href,
        order: index,
        visible: true,
        published: false,
        hasPending: false,
      })),
    };
  }
}

export type SocialItem = {
  slug: string;
  label: string;
  platform: string;
  url: string;
  order: number;
  visible: boolean;
  published: boolean;
  hasPending: boolean;
};

export type SocialRead = { items: SocialItem[]; source: SettingsSource };

/** Réseaux sociaux (repli sur `src/content/site.ts`). */
export async function readSocials(): Promise<SocialRead> {
  try {
    const docs = await listDocuments("social");
    if (docs.length === 0) throw new Error("collection social vide");
    return {
      source: "base",
      items: docs.map((doc) => ({
        slug: doc.slug,
        label: textOf(doc.draft.data.label),
        platform: textOf(doc.draft.data.platform),
        url: textOf(doc.draft.data.url),
        order: doc.draft.order,
        visible: doc.draft.visible,
        published: Boolean(doc.published),
        hasPending: Boolean(doc.has_unpublished_changes),
      })),
    };
  } catch (error) {
    console.error("[cms] réseaux sociaux illisibles, repli sur les fichiers :", error instanceof Error ? error.message : error);
    return {
      source: "fichiers",
      items: siteFile.socials.map((item, index) => ({
        slug: item.id,
        label: item.label,
        platform: item.id,
        url: item.url,
        order: index,
        visible: true,
        published: false,
        hasPending: false,
      })),
    };
  }
}

/* ───────────────────── écriture : menu et pied de page ───────────────────── */

/**
 * `nav_link` et `social` forment le menu et le pied de page. Leur identifiant n'est pas saisi
 * à la main : il est déduit de la destination (lien) ou de la plateforme (réseau), pour qu'un
 * même lien ne puisse pas exister deux fois.
 */
const NAV = "nav_link" as const;
const SOCIAL = "social" as const;

/** « / » → `home`, « /ai-workspace » → `ai-workspace`. */
export function navSlugFromHref(href: string): string {
  const clean = href.trim().replace(/\/+$/, "");
  if (clean === "") return "home";
  return clean.replace(/^\//, "").replace(/\//g, "-").toLowerCase();
}

export type NavLinkValues = { label: Bilingual; href: string };
export type SocialValues = { label: string; platform: string; url: string };

/** Enregistre un lien de menu ; `publish` recopie le brouillon dans la version publiée. */
export async function saveNavLink(slug: string, values: NavLinkValues, publish: boolean): Promise<void> {
  if (!Slug.safeParse(slug).success) throw new Error(`Identifiant de lien invalide : « ${slug} ».`);
  const current = await getDocument(NAV, slug);
  if (!current) throw new Error("Ce lien n'existe plus. Recharge la page.");
  const version: VersionEnvelope = {
    v: 1,
    visible: current.draft.visible,
    order: current.draft.order,
    data: { label: values.label, href: values.href },
  };
  await saveDraft(NAV, slug, version);
  if (publish) await publishDocument(NAV, slug);
}

/** Crée un lien de menu (publié d'emblée : un menu n'a d'intérêt que visible). */
export async function createNavLink(values: NavLinkValues): Promise<string> {
  const slug = navSlugFromHref(values.href);
  if (!Slug.safeParse(slug).success) throw new Error(`Destination invalide : « ${values.href} ».`);
  if (!values.href.startsWith("/")) throw new Error("La destination doit commencer par « / ».");
  if (await getDocument(NAV, slug)) throw new Error(`Un lien vers « ${values.href} » existe déjà.`);

  const version: VersionEnvelope = {
    v: 1,
    visible: true,
    order: await nextOrder(NAV),
    data: { label: values.label, href: values.href },
  };
  await saveDraft(NAV, slug, version);
  await publishDocument(NAV, slug);
  return slug;
}

export async function deleteNavLink(slug: string): Promise<void> {
  await deleteDocument(NAV, slug);
}

/** Enregistre un réseau social. */
export async function saveSocial(slug: string, values: SocialValues, publish: boolean): Promise<void> {
  if (!Slug.safeParse(slug).success) throw new Error(`Identifiant de réseau invalide : « ${slug} ».`);
  const current = await getDocument(SOCIAL, slug);
  if (!current) throw new Error("Ce réseau n'existe plus. Recharge la page.");
  const version: VersionEnvelope = {
    v: 1,
    visible: current.draft.visible,
    order: current.draft.order,
    data: { label: values.label, platform: values.platform, url: values.url },
  };
  await saveDraft(SOCIAL, slug, version);
  if (publish) await publishDocument(SOCIAL, slug);
}

export async function createSocial(values: SocialValues): Promise<string> {
  const slug = values.platform.trim().toLowerCase();
  if (!Slug.safeParse(slug).success) {
    throw new Error("Plateforme invalide : lettres minuscules, chiffres et tirets (ex. github, linkedin).");
  }
  if (await getDocument(SOCIAL, slug)) throw new Error(`Le réseau « ${slug} » existe déjà.`);

  const version: VersionEnvelope = {
    v: 1,
    visible: true,
    order: await nextOrder(SOCIAL),
    data: { label: values.label, platform: slug, url: values.url },
  };
  await saveDraft(SOCIAL, slug, version);
  await publishDocument(SOCIAL, slug);
  return slug;
}

export async function deleteSocial(slug: string): Promise<void> {
  await deleteDocument(SOCIAL, slug);
}

/**
 * Échange une entrée avec sa voisine, puis republie : l'ordre affiché sur le site vient de la
 * version publiée, donc modifier le seul brouillon ne changerait rien à l'écran.
 */
export async function moveOrderedEntry(
  collection: "nav_link" | "social",
  slug: string,
  direction: "up" | "down",
): Promise<void> {
  const docs = await listDocuments(collection);
  const index = docs.findIndex((doc) => doc.slug === slug);
  if (index < 0) throw new Error("Entrée introuvable.");
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= docs.length) return; // déjà en bout de liste

  // Des ordres identiques (import ancien) rendraient l'échange muet : on repart des positions.
  const orders = docs.map((doc) => doc.draft.order);
  const duplicates = new Set(orders).size !== orders.length;
  const planned = docs.map((doc, position) => ({ slug: doc.slug, order: duplicates ? position : doc.draft.order }));
  const moved = planned[index].order;
  planned[index].order = planned[target].order;
  planned[target].order = moved;

  const changes = planned.filter((entry, position) => entry.order !== docs[position].draft.order);
  if (changes.length === 0) return;

  await transaction(async (client) => {
    for (const change of changes) {
      await client.query(
        `update documents set draft = jsonb_set(draft, '{order}', to_jsonb($3::int)), updated_at = now()
          where collection = $1 and slug = $2`,
        [collection, change.slug, change.order],
      );
    }
    await client.query(
      `update documents set published = draft
        where collection = $1 and slug = any($2::text[]) and published is not null`,
      [collection, changes.map((change) => change.slug)],
    );
  });
}
