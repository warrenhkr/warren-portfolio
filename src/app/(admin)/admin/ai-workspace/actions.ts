"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteDocument, publishDocument, saveDraft, unpublishDocument, type VersionEnvelope } from "@/lib/cms/documents";
import { Slug } from "@/lib/content/schemas";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const bilingual = (fd: FormData, key: string) => ({ fr: str(fd, `${key}Fr`), en: str(fd, `${key}En`) });

const USAGE = ["regular", "experiment", "unconfirmed"] as const;
type Usage = (typeof USAGE)[number];
const usageOf = (value: string): Usage => ((USAGE as readonly string[]).includes(value) ? (value as Usage) : "unconfirmed");

function versionFrom(formData: FormData): VersionEnvelope {
  const icon = str(formData, "icon");
  return {
    v: 1,
    visible: formData.get("visible") === "on",
    order: Number(str(formData, "order")) || 0,
    data: {
      name: str(formData, "name").slice(0, 60),
      ...(icon ? { icon } : {}),
      url: str(formData, "url"),
      role: bilingual(formData, "role"),
      text: bilingual(formData, "text"),
      usage: usageOf(str(formData, "usage")),
    },
  };
}

function refresh(slug?: string) {
  revalidatePath("/ai-workspace");
  revalidatePath("/admin/ai-workspace");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/admin/ai-workspace/${slug}`);
}

/** Crée ou met à jour un outil IA, puis publie si demandé. */
export async function saveAiTool(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug").toLowerCase();
  if (!Slug.safeParse(slug).success) redirect("/admin/ai-workspace/new?e=slug");

  if (!str(formData, "name")) redirect(`/admin/ai-workspace/${slug}?e=name`);
  if (!/^https?:\/\//i.test(str(formData, "url"))) redirect(`/admin/ai-workspace/${slug}?e=url`);

  const intent = str(formData, "intent") || "draft";

  try {
    await saveDraft("ai_tool", slug, versionFrom(formData));
    if (intent === "publish") {
      await publishDocument("ai_tool", slug);
      await logActivity("document.publish", "Espace IA", { slug });
    } else {
      await logActivity("document.save", "Espace IA", { slug });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(`/admin/ai-workspace/${slug}?e=${encodeURIComponent(message.slice(0, 120))}`);
  }

  refresh(slug);
  redirect(`/admin/ai-workspace/${slug}?ok=${intent === "publish" ? "publie" : "enregistre"}`);
}

export async function publishAiTool(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await publishDocument("ai_tool", slug);
  await logActivity("document.publish", "Espace IA", { slug });
  refresh(slug);
}

export async function unpublishAiTool(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await unpublishDocument("ai_tool", slug);
  await logActivity("document.unpublish", "Espace IA", { slug });
  refresh(slug);
  redirect("/admin/ai-workspace?ok=dépublié");
}

export async function deleteAiTool(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await deleteDocument("ai_tool", slug);
  await logActivity("document.delete", "Espace IA", { slug });
  refresh(slug);
  redirect("/admin/ai-workspace?ok=supprimé");
}
