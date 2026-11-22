"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteDocument, publishDocument, saveDraft, unpublishDocument, type VersionEnvelope } from "@/lib/cms/documents";
import { Slug } from "@/lib/content/schemas";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const TECH_STATUS = ["used", "exploring", "unconfirmed"] as const;
type TechStatus = (typeof TECH_STATUS)[number];
const statusOf = (value: string): TechStatus =>
  (TECH_STATUS as readonly string[]).includes(value) ? (value as TechStatus) : "unconfirmed";

function versionFrom(formData: FormData): VersionEnvelope {
  const icon = str(formData, "icon");
  return {
    v: 1,
    visible: formData.get("visible") === "on",
    order: Number(str(formData, "order")) || 0,
    data: {
      name: str(formData, "name").slice(0, 60),
      ...(icon ? { icon } : {}),
      category: str(formData, "category") === "software" ? "software" : "hardware",
      status: statusOf(str(formData, "status")),
    },
  };
}

function refresh(slug?: string) {
  revalidatePath("/stack");
  revalidatePath("/admin/stack");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/admin/stack/${slug}`);
}

/** Crée ou met à jour une technologie de la stack, puis publie si demandé. */
export async function saveTech(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug").toLowerCase();
  if (!Slug.safeParse(slug).success) redirect("/admin/stack/new?e=slug");

  if (!str(formData, "name")) redirect(`/admin/stack/${slug}?e=name`);

  const intent = str(formData, "intent") || "draft";

  try {
    await saveDraft("tech", slug, versionFrom(formData));
    if (intent === "publish") {
      await publishDocument("tech", slug);
      await logActivity("document.publish", "Stack", { slug });
    } else {
      await logActivity("document.save", "Stack", { slug });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(`/admin/stack/${slug}?e=${encodeURIComponent(message.slice(0, 120))}`);
  }

  refresh(slug);
  redirect(`/admin/stack/${slug}?ok=${intent === "publish" ? "publie" : "enregistre"}`);
}

export async function publishTech(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await publishDocument("tech", slug);
  await logActivity("document.publish", "Stack", { slug });
  refresh(slug);
}

export async function unpublishTech(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await unpublishDocument("tech", slug);
  await logActivity("document.unpublish", "Stack", { slug });
  refresh(slug);
  redirect("/admin/stack?ok=dépublié");
}

export async function deleteTech(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await deleteDocument("tech", slug);
  await logActivity("document.delete", "Stack", { slug });
  refresh(slug);
  redirect("/admin/stack?ok=supprimé");
}
