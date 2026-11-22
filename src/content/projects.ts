import { l, type Category, type L } from "@/lib/types";

export type Project = {
  slug: string;
  category: Category;
  title: L;
  summary?: L;
  /** Chemin dans /public, ex. "/images/robot.jpg" */
  image?: string;
  tech: string[];
  description?: L;
  problem?: L;
  goals?: L[];
  solution?: L;
  role?: L;
  results?: L;
  gallery?: { src: string; alt: L }[];
  videos?: { url: string; label: L }[];
  links?: { github?: string; demo?: string };
};

/**
 * Ajouter un projet = ajouter un objet ci-dessous. Les champs absents affichent « À renseigner ».
 * Ne renseigner que des informations réelles.
 */
export const projects: Project[] = [
  {
    slug: "robot-suiveur-de-ligne",
    category: "hardware",
    title: l("Robot suiveur de ligne", "Line-following robot"),
    summary: l("Robot autonome qui suit une ligne tracée au sol.", "Autonomous robot that follows a line drawn on the floor."),
    tech: [], // TODO : composants et langages réellement utilisés
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
