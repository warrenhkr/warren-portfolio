import { loadEnv } from "./lib/env";
import { deleteDocument, publishDocument, publishedDocuments, saveDraft } from "../src/lib/cms/documents";
import { getProjectsForPublic } from "../src/lib/cms/public";

/**
 * Vérifie la chaîne complète côté données : brouillon → publication → visible publiquement → suppression.
 * Crée puis supprime son propre document de test ; ne touche à aucun contenu réel.
 */
async function main() {
  loadEnv();
  const slug = "verification-chaine-contenu";
  const version = {
    v: 1,
    visible: true,
    order: 99,
    data: { title: { fr: "Vérification", en: "Check" }, category: "software" as const, tech: ["test"], summary: { fr: "test", en: "test" } },
  };

  await saveDraft("project", slug, version);
  const apresBrouillon = (await publishedDocuments("project")).some((d) => d.slug === slug);
  console.log(`1. brouillon enregistré      → visible publiquement ? ${apresBrouillon} (attendu false)`);

  await publishDocument("project", slug);
  const apresPublication = (await publishedDocuments("project")).some((d) => d.slug === slug);
  console.log(`2. après publication         → visible publiquement ? ${apresPublication} (attendu true)`);

  const publics = await getProjectsForPublic();
  const trouve = publics.find((p) => p.slug === slug);
  console.log(`3. lecture publique          → projet présent ? ${Boolean(trouve)} | titre = ${trouve?.title?.fr ?? "—"}`);

  await deleteDocument("project", slug);
  const apresSuppression = (await publishedDocuments("project")).some((d) => d.slug === slug);
  const restants = publics.length;
  console.log(`4. après suppression         → encore présent ? ${apresSuppression} (attendu false)`);

  console.log(`\nprojets publics avant nettoyage : ${restants}`);
}

main().catch((error) => {
  console.error("Échec complet :", error);
  process.exit(1);
});
