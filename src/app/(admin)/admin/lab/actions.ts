"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteDocument, publishDocument, saveDraft, unpublishDocument, type VersionEnvelope } from "@/lib/cms/documents";
import { Slug } from "@/lib/content/schemas";

/**
 * Actions de l'écran « Lab ».
 * Une entrée de labo est un document de la collection `lab_entry` : brouillon puis publication,
 * exactement comme les projets et les compétences. Toute écriture est validée par le schéma Zod.
 */

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const bilingual = (fd: FormData, key: string) => ({ fr: str(fd, `${key}Fr`), en: str(fd, `${key}En`) });

const KINDS = ["experiment", "prototype", "test", "concept", "poc", "exploration"] as const;

/** « ESP32, C++, PlatformIO » → ["ESP32", "C++", "PlatformIO"] (doublons et vides retirés). */
function techList(raw: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const part of raw.split(",")) {
    const value = part.trim().slice(0, 40);
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    list.push(value);
  }
  return list.slice(0, 20);
}

function versionFrom(formData: FormData): VersionEnvelope {
  const kind = str(formData, "kind");
  const category = str(formData, "category") === "software" ? "software" : "hardware";
  const link = str(formData, "link");

  const data: Record<string, unknown> = {
    kind: (KINDS as readonly string[]).includes(kind) ? kind : "experiment",
    category,
    title: bilingual(formData, "title"),
    text: bilingual(formData, "text"),
  };

  const tech = techList(str(formData, "tech"));
  if (tech.length > 0) data.tech = tech;
  // Une URL vide n'est pas écrite : le schéma n'accepte que du http(s) ou l'absence de champ.
  if (link) data.link = link;

  return {
    v: 1,
    visible: formData.get("visible") === "on",
    order: Number(str(formData, "order")) || 0,
    data,
  };
}

function refresh(slug?: string) {
  revalidatePath("/lab");
  revalidatePath("/admin/lab");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/admin/lab/${slug}`);
}

export async function saveLabEntry(formData: FormData): Promise<void> {
  await assertAdmin();

  const slug = str(formData, "slug").toLowerCase();
  if (!Slug.safeParse(slug).success) redirect("/admin/lab/new?e=slug");

  const title = bilingual(formData, "title");
  if (!title.fr.trim() && !title.en.trim()) redirect(`/admin/lab/${slug}?e=title`);

  const intent = str(formData, "intent") || "draft";

  try {
    await saveDraft("lab_entry", slug, versionFrom(formData));
    if (intent === "publish") {
      await publishDocument("lab_entry", slug);
      await logActivity("document.publish", "Lab", { slug });
    } else {
      await logActivity("document.save", "Lab", { slug });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "échec inconnu";
    redirect(`/admin/lab/${slug}?e=${encodeURIComponent(message.slice(0, 120))}`);
  }

  refresh(slug);
  redirect(`/admin/lab/${slug}?ok=${intent === "publish" ? "publie" : "enregistre"}`);
}

export async function publishLabEntry(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await publishDocument("lab_entry", slug);
  await logActivity("document.publish", "Lab", { slug });
  refresh(slug);
}

export async function unpublishLabEntry(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await unpublishDocument("lab_entry", slug);
  await logActivity("document.unpublish", "Lab", { slug });
  refresh(slug);
  redirect("/admin/lab?ok=dépublié");
}

export async function deleteLabEntry(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = str(formData, "slug");
  await deleteDocument("lab_entry", slug);
  await logActivity("document.delete", "Lab", { slug });
  refresh(slug);
  redirect("/admin/lab?ok=supprimé");
}
