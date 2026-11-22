"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteDocument, publishDocument, saveDraft, unpublishDocument, type VersionEnvelope } from "@/lib/cms/documents";
import { Slug } from "@/lib/content/schemas";

/**
 * Actions de l'écran « Certifications ».
 * Règle de contenu du projet : on n'enregistre que des certifications réellement obtenues.
 * Le schéma accepte un émetteur et une année facultatifs, jamais de valeur inventée par défaut.
 */

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const bilingual = (fd: FormData, key: string) => ({ fr: str(fd, `${key}Fr`), en: str(fd, `${key}En`) });

function versionFrom(formData: FormData): VersionEnvelope {
  return {
    v: 1,
    visible: formData.get("visible") === "on",
    order: Number(str(formData, "order")) || 0,
    data: {
      title: bilingual(formData, "title"),
      issuer: str(formData, "issuer").slice(0, 120),
      year: str(formData, "year").slice(0, 20),
    },
  };
}

function refresh(slug?: string) {
  revalidatePath("/skills"); // la rubrique « Certifications » vit sur /skills
  revalidatePath("/admin/certifications");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/admin/certifications/${slug}`);
}

export async function saveCertification(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug").toLowerCase();
  if (!Slug.safeParse(slug).success) redirect("/admin/certifications/new?e=slug");

  const title = bilingual(formData, "title");
  if (!title.fr.trim() && !title.en.trim()) redirect(`/admin/certifications/${slug}?e=title`);

  const intent = str(formData, "intent") || "draft";

  try {
    await saveDraft("certification", slug, versionFrom(formData));
    if (intent === "publish") {
      await publishDocument("certification", slug);
      await logActivity("document.publish", "Certifications", { slug });
    } else {
      await logActivity("document.save", "Certifications", { slug });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(`/admin/certifications/${slug}?e=${encodeURIComponent(message.slice(0, 120))}`);
  }

  refresh(slug);
  redirect(`/admin/certifications/${slug}?ok=${intent === "publish" ? "publie" : "enregistre"}`);
}

export async function publishCertification(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await publishDocument("certification", slug);
  await logActivity("document.publish", "Certifications", { slug });
  refresh(slug);
}

export async function unpublishCertification(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await unpublishDocument("certification", slug);
  await logActivity("document.unpublish", "Certifications", { slug });
  refresh(slug);
  redirect("/admin/certifications?ok=dépublié");
}

export async function deleteCertification(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await deleteDocument("certification", slug);
  await logActivity("document.delete", "Certifications", { slug });
  refresh(slug);
  redirect("/admin/certifications?ok=supprimé");
}
