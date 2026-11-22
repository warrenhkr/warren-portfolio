"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteDocument, publishDocument, saveDraft, unpublishDocument, type VersionEnvelope } from "@/lib/cms/documents";
import { Slug } from "@/lib/content/schemas";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const bilingual = (fd: FormData, key: string) => ({ fr: str(fd, `${key}Fr`), en: str(fd, `${key}En`) });

function versionFrom(formData: FormData): VersionEnvelope {
  return {
    v: 1,
    visible: formData.get("visible") === "on",
    order: Number(str(formData, "order")) || 0,
    data: {
      category: str(formData, "category") === "software" ? "software" : "hardware",
      icon: str(formData, "icon") || "cpu",
      name: bilingual(formData, "name"),
      text: bilingual(formData, "text"),
    },
  };
}

function refresh(slug?: string) {
  revalidatePath("/skills");
  revalidatePath("/admin/skills");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/admin/skills/${slug}`);
}

/** Crée ou met à jour une compétence, puis publie si demandé. */
export async function saveSkill(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug").toLowerCase();
  if (!Slug.safeParse(slug).success) redirect("/admin/skills/new?e=slug");

  const name = bilingual(formData, "name");
  if (!name.fr.trim() && !name.en.trim()) redirect(`/admin/skills/${slug}?e=name`);

  const intent = str(formData, "intent") || "draft";

  try {
    await saveDraft("skill", slug, versionFrom(formData));
    if (intent === "publish") {
      await publishDocument("skill", slug);
      await logActivity("document.publish", "Compétences", { slug });
    } else {
      await logActivity("document.save", "Compétences", { slug });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(`/admin/skills/${slug}?e=${encodeURIComponent(message.slice(0, 120))}`);
  }

  refresh(slug);
  redirect(`/admin/skills/${slug}?ok=${intent === "publish" ? "publie" : "enregistre"}`);
}

export async function publishSkill(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await publishDocument("skill", slug);
  await logActivity("document.publish", "Compétences", { slug });
  refresh(slug);
}

export async function unpublishSkill(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await unpublishDocument("skill", slug);
  await logActivity("document.unpublish", "Compétences", { slug });
  refresh(slug);
  redirect("/admin/skills?ok=dépublié");
}

export async function deleteSkill(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await deleteDocument("skill", slug);
  await logActivity("document.delete", "Compétences", { slug });
  refresh(slug);
  redirect("/admin/skills?ok=supprimé");
}
