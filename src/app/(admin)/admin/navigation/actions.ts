"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import {
  createNavLink,
  createSocial,
  deleteNavLink,
  deleteSocial,
  moveOrderedEntry,
  saveNavLink,
  saveSocial,
} from "@/lib/cms/settings";

/**
 * Actions de l'écran « Navigation et footer ».
 *
 * Le menu et le pied de page apparaissent sur TOUTES les pages publiques : après chaque écriture
 * on revalide le layout entier, sinon une page déjà en cache continuerait d'afficher l'ancien menu.
 * Aucune écriture hors soumission explicite ; toute erreur revient à l'écran en `?e=`.
 */

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const bilingual = (formData: FormData, key: string) => ({ fr: str(formData, `${key}Fr`), en: str(formData, `${key}En`) });
const back = (query: string) => `/admin/navigation?${query}`;
const failure = (error: unknown) => (error instanceof Error ? error.message : "échec inconnu").slice(0, 160);

function refresh() {
  revalidatePath("/", "layout"); // menu + pied de page sur tout le site
  revalidatePath("/admin/navigation");
  revalidatePath("/admin");
}

/* ------------------------------- menu principal ------------------------------- */

export async function saveNav(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug");
  const href = str(formData, "href");
  const label = bilingual(formData, "label");
  const intent = str(formData, "intent") || "draft";

  if (!href.startsWith("/")) redirect(back(`e=${encodeURIComponent("La destination doit commencer par « / ».")}`));
  if (!label.fr && !label.en) redirect(back(`e=${encodeURIComponent("Le libellé doit contenir au moins une langue.")}`));

  try {
    await saveNavLink(slug, { label, href }, intent === "publish");
    await logActivity(intent === "publish" ? "nav.publish" : "nav.save", "Navigation", { slug, href });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back(`ok=${intent === "publish" ? "lien-publie" : "lien-enregistre"}`));
}

export async function addNav(formData: FormData): Promise<void> {
  await assertAdmin();

  const href = str(formData, "href");
  const label = bilingual(formData, "label");
  if (!href) redirect(back(`e=${encodeURIComponent("Renseignez la destination du lien.")}`));
  if (!label.fr && !label.en) redirect(back(`e=${encodeURIComponent("Le libellé doit contenir au moins une langue.")}`));

  try {
    const slug = await createNavLink({ label, href });
    await logActivity("nav.create", "Navigation", { slug, href });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back("ok=lien-ajoute"));
}

export async function removeNav(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");

  try {
    await deleteNavLink(slug);
    await logActivity("nav.delete", "Navigation", { slug });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back("ok=lien-supprime"));
}

export async function moveNav(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  const direction = str(formData, "dir") === "up" ? "up" : "down";

  try {
    await moveOrderedEntry("nav_link", slug, direction);
    await logActivity("nav.move", "Navigation", { slug, direction });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back("ok=ordre-modifie"));
}

/* ------------------------------- pied de page ------------------------------- */

export async function saveSoc(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug");
  const platform = str(formData, "platform") || slug;
  const values = { label: str(formData, "label"), platform, url: str(formData, "url") };
  const intent = str(formData, "intent") || "draft";

  if (!values.label) redirect(back(`e=${encodeURIComponent("Le nom du réseau ne peut pas être vide.")}`));

  try {
    await saveSocial(slug, values, intent === "publish");
    await logActivity(intent === "publish" ? "social.publish" : "social.save", "Réseaux", { slug });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back(`ok=${intent === "publish" ? "reseau-publie" : "reseau-enregistre"}`));
}

export async function addSoc(formData: FormData): Promise<void> {
  await assertAdmin();

  const values = { label: str(formData, "label"), platform: str(formData, "platform"), url: str(formData, "url") };
  if (!values.platform) redirect(back(`e=${encodeURIComponent("Renseignez la plateforme (ex. github).")}`));
  if (!values.label) redirect(back(`e=${encodeURIComponent("Renseignez le nom affiché du réseau.")}`));

  try {
    const slug = await createSocial(values);
    await logActivity("social.create", "Réseaux", { slug });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back("ok=reseau-ajoute"));
}

export async function removeSoc(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");

  try {
    await deleteSocial(slug);
    await logActivity("social.delete", "Réseaux", { slug });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back("ok=reseau-supprime"));
}

export async function moveSoc(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  const direction = str(formData, "dir") === "up" ? "up" : "down";

  try {
    await moveOrderedEntry("social", slug, direction);
    await logActivity("social.move", "Réseaux", { slug, direction });
  } catch (error) {
    redirect(back(`e=${encodeURIComponent(failure(error))}`));
  }

  refresh();
  redirect(back("ok=ordre-modifie"));
}
