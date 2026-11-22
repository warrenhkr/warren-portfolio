"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import { deleteMessageById, isMessageId, markMessageRead } from "./queries";

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

/** Seule une URL interne de la boîte de réception est acceptée comme retour. */
const RETURN_RE = /^\/admin\/messages(?:\?[^\s#]*)?$/;

function returnTo(formData: FormData): string {
  const back = str(formData, "back");
  return RETURN_RE.test(back) ? back : "/admin/messages";
}

function flash(url: string, key: "ok" | "e", value: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${key}=${encodeURIComponent(value)}`;
}

function refresh(): void {
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

/** Marque un message comme lu (ou non lu) depuis la liste ou le détail. */
export async function setMessageRead(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const back = returnTo(formData);
  const read = str(formData, "read") !== "false";

  if (!isMessageId(id)) redirect(flash(back, "e", "message introuvable"));

  let changed = false;
  try {
    changed = await markMessageRead(id, read);
  } catch {
    redirect(flash(back, "e", "échec de la mise à jour du message"));
  }

  if (changed) await logActivity(read ? "message.read" : "message.unread", "Messages", { id });

  refresh();
  redirect(flash(back, "ok", read ? "marqué comme lu" : "marqué comme non lu"));
}

/** Suppression définitive, journalisée dans `activity`. */
export async function deleteMessage(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const back = returnTo(formData);

  if (!isMessageId(id)) redirect(flash(back, "e", "message introuvable"));

  let deleted: Awaited<ReturnType<typeof deleteMessageById>> = null;
  try {
    deleted = await deleteMessageById(id);
  } catch {
    redirect(flash(back, "e", "échec de la suppression du message"));
  }

  if (!deleted) redirect(flash(back, "e", "message déjà supprimé"));

  // On journalise l'identifiant et le sujet ; ni l'adresse e-mail ni le corps
  // ne partent dans le journal d'activité.
  await logActivity("message.delete", "Messages", { id: deleted.id, subject: deleted.subject, from: deleted.name });

  refresh();
  redirect(flash(back, "ok", "message supprimé"));
}
