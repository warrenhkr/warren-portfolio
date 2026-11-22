import { l, type L } from "@/lib/types";

/** TODO : mettre le chemin de ton vrai portrait, ex. "/images/portrait.jpg" (fichier dans public/images). */
export const portrait: string | null = null;

export const domains: { hardware: L[]; software: L[] } = {
  hardware: [
    l("Électronique embarquée", "Embedded electronics"),
    l("Internet of Things (IoT)", "Internet of Things (IoT)"),
    l("Robotique", "Robotics"),
    l("Systèmes électroniques", "Electronic systems"),
    l("Microcontrôleurs", "Microcontrollers"),
  ],
  software: [
    l("Développement web", "Web development"),
    l("Développement d'applications", "Application development"),
    l("Programmation", "Programming"),
    l("Développement de logiciels", "Software development"),
    l("Code pour systèmes embarqués", "Code for embedded systems"),
  ],
};
