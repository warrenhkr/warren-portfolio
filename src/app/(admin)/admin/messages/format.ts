/** Formatage des dates de messages : relatif pour la fraîcheur, absolu en infobulle. */

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function relativeFr(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "date inconnue";
  const diff = now - time;
  if (diff < 0) return "à l’instant";
  if (diff < MINUTE) return "à l’instant";
  const minutes = Math.floor(diff / MINUTE);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(diff / HOUR);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(time));
}

export function absoluteFr(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));
}

/** Aperçu du corps dans la liste : une seule ligne, bornée. */
export function excerpt(body: string, max = 90): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
