import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/lib/auth/password";

/**
 * Génère un mot de passe d'administration fort, son empreinte scrypt et un secret de session.
 * Aucune saisie : rien ne fuit dans l'historique du shell. À lancer une seule fois :
 *   npm run admin:init
 * Puis coller les deux lignes affichées dans .env.local et conserver le mot de passe.
 */
const PASSWORD = randomBytes(18).toString("base64url"); // 24 caractères
const SECRET = randomBytes(32).toString("base64url"); // 43 caractères
const HASH = hashPassword(PASSWORD);

console.log("");
console.log("  Mot de passe d'administration (à conserver dans ton gestionnaire) :");
console.log(`    ${PASSWORD}`);
console.log("");
console.log("  À ajouter dans .env.local :");
console.log(`    ADMIN_PASSWORD_HASH=${HASH}`);
console.log(`    ADMIN_SESSION_SECRET=${SECRET}`);
console.log("");
console.log("  Puis redémarrer le serveur. Connexion sur /admin/login");
console.log("");
