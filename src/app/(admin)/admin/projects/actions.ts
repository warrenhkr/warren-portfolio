"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteDocument, publishDocument, saveDraft, unpublishDocument, type VersionEnvelope } from "@/lib/cms/documents";
import { Slug } from "@/lib/content/schemas";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const bilingual = (fd: FormData, key: string) => ({ fr: str(fd, `${key}Fr`), en: str(fd, `${key}En`) });

function versionFrom(formData: FormData, slug: string): { version: VersionEnvelope; intent: string } {
  const intent = str(formData, "intent") || "draft";
  const tech = str(formData, "tech")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30);

  const version: VersionEnvelope = {
    v: 1,
    visible: formData.get("visible") === "on",
    order: Number(str(formData, "order")) || 0,
    data: {
      title: bilingual(formData, "title"),
      category: str(formData, "category") === "software" ? "software" : "hardware",
      summary: bilingual(formData, "summary"),
      description: bilingual(formData, "description"),
      problem: bilingual(formData, "problem"),
      solution: bilingual(formData, "solution"),
      role: bilingual(formData, "role"),
      results: bilingual(formData, "results"),
      tech,
      links: { github: str(formData, "github"), demo: str(formData, "demo") },
    },
  };
  void slug;
  return { version, intent };
}

/** Crée ou met à jour un projet, puis publie si demandé. */
export async function saveProject(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug").toLowerCase();
  if (!Slug.safeParse(slug).success) redirect("/admin/projects/new?e=slug");

  const title = bilingual(formData, "title");
  if (!title.fr.trim() && !title.en.trim()) redirect(`/admin/projects/${slug}?e=title`);

  const { version, intent } = versionFrom(formData, slug);

  try {
    await saveDraft("project", slug, version);
    if (intent === "publish") {
      await publishDocument("project", slug);
      await logActivity("document.publish", "Projets", { slug });
    } else {
      await logActivity("document.save", "Projets", { slug });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(`/admin/projects/${slug}?e=${encodeURIComponent(message.slice(0, 120))}`);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${slug}?ok=${intent === "publish" ? "publie" : "enregistre"}`);
}

export async function publishProject(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await publishDocument("project", slug);
  await logActivity("document.publish", "Projets", { slug });
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/admin/projects");
}

export async function unpublishProject(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await unpublishDocument("project", slug);
  await logActivity("document.unpublish", "Projets", { slug });
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/admin/projects");
  redirect("/admin/projects?ok=dépublié");
}

export async function deleteProject(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await deleteDocument("project", slug);
  await logActivity("document.delete", "Projets", { slug });
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  redirect("/admin/projects?ok=supprimé");
}
