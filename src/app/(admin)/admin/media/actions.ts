"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteMedia, saveAlt, uploadMedia } from "@/lib/media";

/**
 * Actions de la médiathèque.
 *
 * L'envoi passe par une Server Action : le fichier ne transite jamais par le navigateur d'un
 * tiers, et la clé de stockage reste côté serveur. Chaque fichier est traité séparément :
 * un refus n'annule pas les autres, et le bilan remonte en clair sur l'écran.
 */

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const failure = (error: unknown) => (error instanceof Error ? error.message : "échec inconnu").slice(0, 160);

function refresh() {
  revalidatePath("/admin/media");
  revalidatePath("/admin");
}

export async function uploadFiles(formData: FormData): Promise<void> {
  await assertAdmin();

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) redirect("/admin/media?e=Aucun fichier sélectionné.");

  const folder = str(formData, "folder");
  const alt = { fr: str(formData, "altFr"), en: str(formData, "altEn") };

  const errors: string[] = [];
  let sent = 0;

  for (const file of files) {
    const result = await uploadMedia(file, { folder, alt });
    if (result.ok) {
      sent += 1;
      await logActivity("media.upload", file.name.slice(0, 120), { folder, size: result.item.sizeBytes });
    } else {
      errors.push(`${file.name.slice(0, 60)} : ${result.error}`);
    }
  }

  refresh();

  if (sent === 0) redirect(`/admin/media?e=${encodeURIComponent(errors.join(" · ").slice(0, 300))}`);
  if (errors.length > 0) {
    redirect(
      `/admin/media?ok=${sent}&e=${encodeURIComponent(`Fichiers refusés — ${errors.join(" · ").slice(0, 240)}`)}`,
    );
  }
  redirect(`/admin/media?ok=${sent}`);
}

export async function updateAlt(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = str(formData, "id");
  const alt = { fr: str(formData, "altFr"), en: str(formData, "altEn") };

  try {
    await saveAlt(id, alt);
    await logActivity("media.alt", "Texte alternatif", { id });
  } catch (error) {
    redirect(`/admin/media?e=${encodeURIComponent(failure(error))}`);
  }

  refresh();
  redirect("/admin/media?ok=texte");
}

export async function removeMedia(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");

  let outcome: { ok: true } | { ok: false; error: string };
  try {
    outcome = await deleteMedia(id);
  } catch (error) {
    redirect(`/admin/media?e=${encodeURIComponent(failure(error))}`);
  }

  if (!outcome.ok) redirect(`/admin/media?e=${encodeURIComponent(outcome.error)}`);

  await logActivity("media.delete", "Média supprimé", { id });
  refresh();
  redirect("/admin/media?ok=supprime");
}
