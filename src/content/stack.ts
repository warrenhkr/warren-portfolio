import type { Category } from "@/lib/types";

/**
 * status : "used" = utilisée · "exploring" = en exploration · "unconfirmed" = à confirmer
 * Les entrées « unconfirmed » sont des suggestions : valide-les ou supprime-les.
 * `icon` correspond à une clé de brand-icons.ts ; sans logo disponible, une pastille avec l'initiale s'affiche.
 */
export type TechStatus = "used" | "exploring" | "unconfirmed";
export type Tech = { id: string; name: string; icon?: string; category: Category; status: TechStatus };

export const stack: Tech[] = [
  { id: "esp32", name: "ESP32", icon: "espressif", category: "hardware", status: "unconfirmed" },
  { id: "nextjs", name: "Next.js", icon: "nextdotjs", category: "software", status: "used" },
  { id: "react", name: "React", icon: "react", category: "software", status: "used" },
  { id: "typescript", name: "TypeScript", icon: "typescript", category: "software", status: "used" },
  { id: "tailwind", name: "Tailwind CSS", icon: "tailwindcss", category: "software", status: "used" },
  { id: "python", name: "Python", icon: "python", category: "software", status: "unconfirmed" },
  { id: "supabase", name: "Supabase", icon: "supabase", category: "software", status: "unconfirmed" },
  { id: "prisma", name: "Prisma", icon: "prisma", category: "software", status: "unconfirmed" },
];
