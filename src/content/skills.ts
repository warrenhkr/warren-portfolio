import { l, type Category, type L } from "@/lib/types";

export type Skill = { id: string; icon: string; category: Category; name: L; text: L };

/**
 * Domaines annoncés dans le positionnement. Aucun niveau de maîtrise n'est affiché ou inventé.
 */
export const technicalSkills: Skill[] = [
  { id: "embedded", icon: "cpu", category: "hardware", name: l("Électronique embarquée", "Embedded electronics"), text: l("Conception et mise en œuvre de systèmes électroniques embarqués.", "Design and implementation of embedded electronic systems.") },
  { id: "iot", icon: "wifi", category: "hardware", name: l("Internet of Things", "Internet of Things"), text: l("Objets connectés qui mesurent, communiquent et agissent.", "Connected objects that sense, communicate and act.") },
  { id: "robotics", icon: "bot", category: "hardware", name: l("Robotique", "Robotics"), text: l("Systèmes mobiles et autonomes, du capteur à l'actionneur.", "Mobile, autonomous systems, from sensor to actuator.") },
  { id: "electronic-systems", icon: "chip", category: "hardware", name: l("Systèmes électroniques", "Electronic systems"), text: l("Assemblage, câblage et validation de montages électroniques.", "Assembly, wiring and validation of electronic circuits.") },
  { id: "mcu", icon: "cpu", category: "hardware", name: l("Microcontrôleurs", "Microcontrollers"), text: l("Programmation et mise en œuvre de microcontrôleurs.", "Programming and use of microcontrollers.") },
  { id: "embedded-code", icon: "code", category: "software", name: l("Programmation embarquée", "Embedded programming"), text: l("Écrire le code qui s'exécute directement sur le matériel.", "Writing code that runs directly on the hardware.") },
  { id: "web", icon: "globe", category: "software", name: l("Développement web", "Web development"), text: l("Sites et interfaces web modernes.", "Modern websites and web interfaces.") },
  { id: "apps", icon: "layers", category: "software", name: l("Développement d'applications", "Application development"), text: l("Applications pensées pour un usage précis.", "Applications built for a specific use.") },
  { id: "programming", icon: "code", category: "software", name: l("Programmation", "Programming"), text: l("Écrire du code clair et maintenable.", "Writing clear, maintainable code.") },
  { id: "software", icon: "layers", category: "software", name: l("Développement de logiciels", "Software development"), text: l("Concevoir et livrer des logiciels.", "Designing and delivering software.") },
];

export type Credential = { id: string; title: L; issuer?: string; year?: string };
/** TODO : certifications, attestations, formations, diplômes réels. */
export const credentials: Credential[] = [];

export type Tool = { id: string; icon: string; name: L; text: L };
/** TODO : outils professionnels réels. */
export const tools: Tool[] = [];

export type Learning = { id: string; icon: string; category: Category; name: L; text?: L };
/** TODO : compétences en cours d'apprentissage (séparées des compétences maîtrisées). */
export const learning: Learning[] = [];
