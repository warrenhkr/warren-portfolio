# Configuration et déploiement

> État : l'ADMIN est **réellement protégé** (mot de passe scrypt + second facteur TOTP, session en base).
> Ce document décrit l'état livré, pas un plan. Les écrans encore marqués « Bientôt » dans le rail
> sont : À propos, Médiathèque, Sauvegardes.

## 1. Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | oui en production | URL publique (sans slash final) : sitemap, `robots.txt`, Open Graph, canoniques |
| `DATABASE_URL` | oui | Connexion d'exécution (pooler « Transaction », port 6543) |
| `DATABASE_URL_DIRECT` | recommandé | Migrations et sauvegardes (« Session pooler », port 5432) |
| `ADMIN_PASSWORD_HASH` | oui | Hash scrypt du mot de passe administrateur (`npm run admin:init` / `admin:reset`) |
| `ADMIN_TOTP_KEY` | oui | Clé AES-256-GCM qui chiffre le secret TOTP en base (32 octets base64, `npm run admin:keys`) |
| `DATABASE_SSL_VERIFY` | non | `true` pour vérifier le certificat TLS du serveur |
| `DATABASE_POOL_MAX` | non | Connexions simultanées par instance (défaut : 5) |
| `DATABASE_IDLE_TIMEOUT_MS` | non | Durée de vie d'une connexion inactive (défaut : 300 000 ms = 5 min) |
| `DATABASE_CONNECT_TIMEOUT_MS` | non | Délai d'ouverture de connexion (défaut : 20 000 ms) |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | non | Envoi des messages du formulaire de contact |

Aucune clé secrète n'est préfixée `NEXT_PUBLIC_` : seule `NEXT_PUBLIC_SITE_URL` (publique par nature) est
visible dans le navigateur. En local, copiez `.env.example` vers `.env.local` (ignoré par git).

**Pièges connus** (déjà rencontrés) :
- un `$` dans une valeur de `.env.local` est interprété par Next (dotenv-expand) : encodez-le en `%24` dans les URL ;
- un `@` brut dans le mot de passe casse `pg_dump` / libpq : encodez-le en `%40` ;
- si le mot de passe de la base contient des caractères spéciaux, il doit être encodé pour l'URL.

## 2. Configuration Supabase

1. Un projet Supabase existe déjà pour ce portfolio. Région : `eu-central-1` (Francfort) — d'où une latence
   d'environ 150 à 300 ms par requête depuis l'Afrique de l'Ouest : c'est normal, pas un bug.
2. Chaînes de connexion (bouton **Connect**) :
   - **Transaction pooler** (port 6543) → `DATABASE_URL`
   - **Session pooler** (port 5432) → `DATABASE_URL_DIRECT`
   Le nom d'utilisateur du pooler est de la forme `postgres.<référence-projet>`.
3. La sécurité par ligne est activée sur toutes les tables, sans aucune politique : les clés publiques
   (`anon`, `authenticated`) n'ont **aucun droit**. Seule la connexion serveur lit et écrit.
4. Le stockage des médias (bucket) n'est pas encore configuré : l'écran Médiathèque reste « Bientôt ».

## 3. Migrations et contenu

```bash
npm run db:status    # état de chaque migration
npm run db:migrate   # applique les migrations en attente (chacune dans une transaction)
npm run db:seed      # importe le contenu actuel du site (idempotent, n'écrase jamais l'existant)
npm run db:check     # vérifie la connexion d'exécution
```

Règles : les fichiers de `db/migrations/` sont numérotés (`0001_…`, `0002_…`). **Une migration appliquée ne se
modifie jamais** : le script détecte toute modification (empreinte) et refuse de continuer. Toute nouvelle table
doit activer la sécurité par ligne (voir la fin de `0001_core.sql`). Faites une sauvegarde
(`docs/BACKUP-RESTORE.md`) avant toute migration en production.

## 4. Déploiement sur Vercel

1. Poussez le dépôt sur GitHub, puis importez-le dans Vercel (Next.js détecté ; Node 20 ou plus).
2. **Settings → Environment Variables** : ajoutez toutes les variables de la section 1 pour l'environnement
   Production. `NEXT_PUBLIC_SITE_URL` doit contenir le domaine réel (`https://…`), jamais `localhost`.
3. Appliquez les migrations **depuis votre machine** (jamais pendant le build) :
   `npm run db:migrate` avec `.env.local` pointant vers Supabase.
4. Déployez, puis vérifiez dans cet ordre :
   - `/` s'affiche, `/robots.txt` et `/sitemap.xml` annoncent le **bon domaine** ;
   - `/admin` redirige vers `/admin/login` (307) et la connexion demande le code à 6 chiffres ;
   - `/admin/login/preview` répond **404** en production (route réservée au développement) ;
   - le formulaire de contact enregistre en base (visible dans `/admin/messages`).

## 5. Création et récupération du compte administrateur

Un seul compte existe : la table `admin` porte une contrainte d'unicité.

```bash
npm run admin:init    # crée le compte (e-mail + mot de passe généré, TOTP désactivé au départ)
npm run admin:keys    # génère ADMIN_TOTP_KEY (32 octets base64) — à conserver précieusement
npm run admin:reset   # réinitialise le mot de passe ET efface toutes les sessions
```

À la première connexion, l'ADMIN impose l'enrôlement du second facteur : un secret TOTP est affiché
(QR + code), puis 10 codes de secours à usage unique. Perdre `ADMIN_TOTP_KEY` rend le second facteur
invérifiable : la récupération passe par `admin:reset`, puis un nouvel enrôlement.

## 6. Sécurité de l'ADMIN (état livré)

- Garde réelle dans le layout de l'ADMIN, dans chaque page, **chaque action serveur** et la route de déconnexion.
- Mot de passe : scrypt (N=16384), sel aléatoire, comparaison en temps constant.
- Second facteur : TOTP RFC 6238, tolérance ±1 fenêtre, rejeu bloqué (`admin.totp_last_step`).
- Codes de secours : hachés en SHA-256, usage unique.
- Session : jeton aléatoire de 32 octets, seul son SHA-256 est stocké, cookie `HttpOnly` + `Secure` +
  `SameSite=lax`, 7 jours glissants, révoquée en base à la déconnexion.
- Limitation : 5 échecs en 15 minutes par identifiant bloquent la tentative suivante.
- Journal : toute action sensible laisse une ligne dans `activity` (`/admin/activity`).

## 7. Points à corriger avant une mise en production publique

- `NEXT_PUBLIC_SITE_URL` : il vaut aujourd'hui `http://localhost:4313` ; `robots.txt` et `sitemap.xml` le reprennent.
- Aucune `Content-Security-Policy` n'est envoyée (les autres en-têtes le sont, dans `next.config.mjs`).
- Les pages `/`, `/about`, `/contact`, `/lab` sortent en `s-maxage=31536000` (statique) : normal tant qu'elles
  ne lisent pas la base, à revoir le jour où le nom du site et le SEO seront branchés sur le CMS.
- L'écran « SEO et réglages » et l'écran « Navigation » écrivent en base, mais **le site public ne lit pas
  encore** `site`, `seo`, `nav_link`, `social` : il utilise `src/content/`. Les collections `project`, `skill`,
  `tech`, `ai_tool`, `lab_entry`, `certification` sont, elles, réellement lues par le site.
