import { l, type Category, type L } from "@/lib/types";

export type LabKind = "experiment" | "prototype" | "test" | "concept" | "poc" | "exploration";

export type LabEntry = { id: string; kind: LabKind; category: Category; title: L; text: L; tech?: string[]; link?: string };

/** TODO : ajouter ici tes vraies expérimentations. */
export const labEntries: LabEntry[] = [];

export const labKinds: { kind: LabKind; icon: string; title: L; text: L }[] = [
  { kind: "experiment", icon: "flask", title: l("Expérimentations", "Experiments"), text: l("Essais ouverts pour comprendre un composant, une bibliothèque ou une idée.", "Open trials to understand a component, a library or an idea.") },
  { kind: "prototype", icon: "cpu", title: l("Prototypes", "Prototypes"), text: l("Premières versions fonctionnelles, avant d'en faire un projet.", "First working versions, before becoming a project.") },
  { kind: "test", icon: "wrench", title: l("Tests techniques", "Technical tests"), text: l("Mesures, comparaisons et validations de choix techniques.", "Measurements, comparisons and validation of technical choices.") },
  { kind: "concept", icon: "spark", title: l("Concepts en développement", "Concepts in progress"), text: l("Idées en cours de maturation, pas encore prototypées.", "Ideas still maturing, not prototyped yet.") },
  { kind: "poc", icon: "check", title: l("Preuves de concept", "Proofs of concept"), text: l("Démonstrations qu'une approche est réalisable.", "Demonstrations that an approach is feasible.") },
  { kind: "exploration", icon: "wifi", title: l("Explorations Hardware et Software", "Hardware & Software explorations"), text: l("Terrains inconnus, de l'IoT au logiciel.", "Uncharted ground, from IoT to software.") },
];
