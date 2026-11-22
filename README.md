# WARREN HOUNKANRIN — Portfolio

Portfolio bilingue (FR / EN), thèmes sombre et clair, Next.js 14 (App Router) + TypeScript + Tailwind CSS 3.

Direction artistique **« Forge & Signal »** : deux matières opposées qui se rencontrent.
La forge (chaud, cuivre) porte le Hardware, le signal (froid, électrique) porte le Software.
Verre dépoli, grain fin, halos radiaux, bento asymétrique, rail de navigation flottant.

| Rôle | Couleur |
|---|---|
| Fond (nuit) | `#0D0D0D` |
| Fond (papier, thème clair) | `#F4F0E9` |
| Forge / Hardware | `#C45A00` (`#FF8A3D` pour le texte sur fond sombre) |
| Signal / Software | `#1A3BCC` (`#7A99FF` pour le texte sur fond sombre) |
| Texte | `#F2EDE6` |

## Démarrer

```bash
npm install
npm run dev -- -H 0.0.0.0 -p 4313   # http://localhost:4313
npm run build && npm start          # production
npm run typecheck                   # TypeScript
npm test                            # tests (schémas + base si TEST_DATABASE_URL)
```

Ne lancez pas `next dev` et `next build` en même temps : ils partagent le dossier `.next`.

## Architecture

```
src/app/(public)/      routes publiques (layout → PublicShell : rail, barre mobile, footer)
src/app/(admin)/       espace privé (phase 1)
src/app/api/contact/   envoi réel via Resend
src/views/             une vue par page (composants clients)
src/components/        ui.tsx (design system), Nav, HeroCinematic, HeroArt, ProjectCard,
                       ContactForm, Footer, Icon, Logo
src/content/           tout le contenu éditorial (source de vérité)
src/lib/               i18n.tsx, theme.tsx, db.ts, schemas de contenu, garde admin
db/ scripts/ tests/    base PostgreSQL, migrations, sauvegarde, tests
```

## Où modifier le contenu

| Fichier | Contenu |
|---|---|
| `site.ts` | **E-mail pro, liens GitHub / LinkedIn**, navigation |
| `copy.ts` | Tous les textes de l'interface (FR + EN) et descriptions SEO |
| `about.ts` | Portrait (`public/images/`), domaines Hardware / Software |
| `projects.ts` | Projets (une entrée = une carte + une page détaillée) |
| `lab.ts` | Expérimentations du Lab |
| `skills.ts` | Compétences, certifications, outils, « en cours d'apprentissage » |
| `stack.ts` | Technologies (statut : utilisée / en exploration / à confirmer) |
| `ai.ts` | Outils d'IA |

Chaque information inconnue affiche un emplacement explicite (« À renseigner ») : rien n'est inventé.
Les entrées marquées « À confirmer » (stack, outils IA) sont des suggestions à valider ou supprimer.

Ajouter un logo de technologie : ajouter sa clé dans `src/content/brand-icons.ts` (source : simple-icons.org),
puis la référencer via `icon` dans `stack.ts` / `ai.ts`. Sans logo, une pastille avec l'initiale s'affiche.

## Interface

- **Rail flottant** (≥ 1280 px) : verre dépoli, se déploie au survol, indicateur de page active.
- **Mobile** : barre flottante + feuille plein écran numérotée (fermeture Échap / clic extérieur).
- **Intro cinématique** sur l'accueil : écran clair → fissure → ouverture → hero. Jouée une fois par
  session (`sessionStorage`), skippable (bouton, Échap, molette), désactivée si `prefers-reduced-motion`.
- **Thème** : sombre par défaut (identité), clair « papier d'atelier » entièrement travaillé, choix mémorisé.
- **Langue** : bascule FR/EN instantanée, mémorisée, `lang` mis à jour sur `<html>`.

## Formulaire de contact (envoi réel)

La route `src/app/api/contact/route.ts` envoie via [Resend](https://resend.com). Renseigne dans `.env.local` :

```bash
RESEND_API_KEY=...
CONTACT_TO_EMAIL=...
CONTACT_FROM_EMAIL=...   # après vérification du domaine chez Resend
NEXT_PUBLIC_SITE_URL=https://ton-domaine.com
```

Tant que ce n'est pas configuré, le formulaire affiche clairement que le message **n'a pas été envoyé**.

## Mise en ligne

Renseigne `NEXT_PUBLIC_SITE_URL` (domaine final) pour le sitemap, les canonical et les aperçus de partage.
Pages : `/`, `/about`, `/projects`, `/projects/[slug]`, `/lab`, `/skills`, `/stack`, `/ai-workspace`,
`/contact`, plus `sitemap.xml`, `robots.txt`, favicon, image Open Graph, JSON-LD `Person` et page 404.

## Limites connues

- La langue se change côté navigateur : les titres SEO et les aperçus de partage restent en français.
  Des URLs par langue (`/fr`, `/en` + `hreflang`) seraient nécessaires pour un SEO bilingue complet.
- Une seule image de partage (générée) pour tout le site.
- L'ADMIN est en phase 1 : `/admin` répond 404 en production tant que l'authentification n'est pas livrée.
