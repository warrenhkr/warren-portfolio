"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { publishDocument } from "@/lib/cms/documents";
import { saveSeoPage, saveSiteSettings, SETTINGS_SLUG } from "@/lib/cms/settings";

/**
 * Actions des réglages du site.
 * Aucune écriture n'a lieu hors soumission explicite : l'écran ne fait que lire au chargement.
 * Toute écriture passe par `saveDraft` (validation Zod du schéma de la collection) et laisse une trace dans `activity`.
 */

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const bilingual = (formData: FormData, key: string) => ({ fr: str(formData, `${key}Fr`), en: str(formData, `${key}En`) });
const back = (query: string) => `/admin/settings?${query}`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function saveSite(formData: FormData): Promise<void> {
  await assertAdmin();

  const name = str(formData, "name");
  const email = str(formData, "email");
  const intent = str(formData, "intent") || "draft";

  if (!name) redirect(back(`e=${encodeURIComponent("Le nom du site ne peut pas être vide.")}`));
  if (name.length > 80) redirect(back(`e=${encodeURIComponent("Le nom du site dépasse 80 caractères.")}`));
  if (email && !EMAIL.test(email)) redirect(back(`e=${encodeURIComponent("Adresse e-mail invalide.")}`));

  try {
    await saveSiteSettings({ name, email });
    if (intent === "publish") {
      await publishDocument("site", SETTINGS_SLUG);
      await logActivity("settings.publish", "Réglages du site", { collection: "site", slug: SETTINGS_SLUG });
    } else {
      await logActivity("settings.save", "Réglages du site", { collection: "site", slug: SETTINGS_SLUG });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(back(`e=${encodeURIComponent(message.slice(0, 160))}`));
  }

  revalidatePath("/admin/settings");
  redirect(back(`ok=${intent === "publish" ? "site-publie" : "site-enregistre"}`));
}

export async function saveSeo(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug");
  const intent = str(formData, "intent") || "draft";
  const title = bilingual(formData, "title");
  const description = bilingual(formData, "description");

  if (!slug) redirect(back(`e=${encodeURIComponent("Page inconnue.")}`));
  if (!title.fr && !title.en) redirect(back(`e=${encodeURIComponent("Le titre SEO doit contenir au moins une langue.")}`));

  try {
    await saveSeoPage(slug, { title, description });
    if (intent === "publish") {
      await publishDocument("seo", slug);
      await logActivity("settings.publish", "SEO", { collection: "seo", slug });
    } else {
      await logActivity("settings.save", "SEO", { collection: "seo", slug });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(back(`e=${encodeURIComponent(message.slice(0, 160))}`));
  }

  revalidatePath("/admin/settings");
  redirect(back(`ok=${encodeURIComponent(slug)}-${intent === "publish" ? "publie" : "enregistre"}`));
}
