export type AdminModuleStatus = "ready" | "soon";

export type AdminModule = {
  id: string;
  label: string;
  href: string;
  icon: string;
  status: AdminModuleStatus;
};

export type AdminModuleGroup = { label: string; items: AdminModule[] };

/**
 * Plan de l'ADMIN — source unique de la navigation (rail desktop + tiroir mobile + futures routes).
 *
 * Règle : un module passe en "ready" UNIQUEMENT quand son écran est réellement fonctionnel
 * ("Bientôt" = pas de lien cliquable, jamais de lien décoratif qui mène à un 404).
 * Les `href` sont posés dès maintenant pour que les écrans se branchent sans retoucher la coquille.
 * Statut actuel : tableau de bord, projet(s), compétences, stack, espace IA, messages et réglages
 * sont livrés. Les autres modules restent en « Bientôt ».
 */
export const adminGroups: AdminModuleGroup[] = [
  {
    label: "Pilotage",
    items: [{ id: "dashboard", label: "Tableau de bord", href: "/admin", icon: "dashboard", status: "ready" }],
  },
  {
    label: "Contenu",
    items: [
      { id: "about", label: "À propos", href: "/admin/about", icon: "user", status: "soon" },
      { id: "projects", label: "Projets", href: "/admin/projects", icon: "cpu", status: "ready" },
      { id: "lab", label: "Lab", href: "/admin/lab", icon: "flask", status: "ready" },
      { id: "skills", label: "Compétences", href: "/admin/skills", icon: "award", status: "ready" },
      { id: "stack", label: "Ma stack", href: "/admin/stack", icon: "layers", status: "ready" },
      { id: "ai", label: "Espace IA", href: "/admin/ai-workspace", icon: "bot", status: "ready" },
      { id: "certifications", label: "Certifications", href: "/admin/certifications", icon: "graduation", status: "ready" },
    ],
  },
  {
    label: "Ressources",
    items: [
      { id: "media", label: "Médiathèque", href: "/admin/media", icon: "image", status: "soon" },
      { id: "messages", label: "Messages", href: "/admin/messages", icon: "inbox", status: "ready" },
    ],
  },
  {
    label: "Site",
    items: [
      { id: "navigation", label: "Navigation et footer", href: "/admin/navigation", icon: "navigation", status: "ready" },
      { id: "settings", label: "SEO et réglages", href: "/admin/settings", icon: "settings", status: "ready" },
    ],
  },
  {
    label: "Système",
    items: [
      { id: "security", label: "Sécurité", href: "/admin/security", icon: "check", status: "ready" },
      { id: "backups", label: "Sauvegardes", href: "/admin/backups", icon: "down", status: "soon" },
      { id: "activity", label: "Journal d'activité", href: "/admin/activity", icon: "grid", status: "ready" },
    ],
  },
];

/** Liste plate : sert aux vérifications (nombre d'entrées) et aux futurs contrôles de routes. */
export const adminModules: AdminModule[] = adminGroups.flatMap((group) => group.items);
