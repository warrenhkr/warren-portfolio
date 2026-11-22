import { l, type L } from "@/lib/types";

/**
 * Identité et coordonnées du site.
 * TODO : renseigner l'e-mail professionnel et les liens des réseaux.
 * Tant qu'un champ est vide, le site affiche un emplacement « À renseigner » (aucun faux lien).
 */
export const site = {
  name: "WARREN HOUNKANRIN",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  email: "",
  socials: [
    { id: "github", label: "GitHub", url: "" },
    { id: "linkedin", label: "LinkedIn", url: "" },
  ],
};

export const nav: { href: string; label: L }[] = [
  { href: "/", label: l("Accueil", "Home") },
  { href: "/about", label: l("À propos", "About") },
  { href: "/projects", label: l("Projets", "Projects") },
  { href: "/lab", label: l("Lab", "Lab") },
  { href: "/skills", label: l("Compétences", "Skills") },
  { href: "/stack", label: l("Ma stack", "My Stack") },
  { href: "/ai-workspace", label: l("Espace IA", "AI Workspace") },
  { href: "/contact", label: l("Contact", "Contact") },
];
