# Sauvegarde, restauration et tests

## Sauvegarder la base

Prérequis : les outils clients PostgreSQL (`pg_dump`, `pg_restore`) installés sur votre machine, **en version égale ou supérieure** à celle du serveur Supabase
(Windows : installeur PostgreSQL, cochez « Command Line Tools » ; macOS : `brew install libpq` ; Linux : paquet `postgresql-client`).

```bash
npm run db:backup                       # crée backups/portfolio-AAAAMMJJ-HHMMSS.dump
npm run db:backup -- mon-fichier.dump   # nom personnalisé
```

La sauvegarde contient tout le schéma `public` : contenus (brouillons et publiés), métadonnées des médias, messages, journal, historique des migrations.
Dossier `backups/` ignoré par git : **copiez les fichiers ailleurs** (disque externe, stockage cloud privé).
Les sauvegardes contiennent les messages reçus (données personnelles) : ne les publiez jamais.

Fréquence conseillée : avant chaque migration, avant chaque gros changement de contenu, puis au moins chaque semaine.
Les sauvegardes automatiques de Supabase dépendent de votre offre : ne vous y fiez pas comme seule protection.

## Restaurer

```bash
npm run db:restore -- backups/portfolio-20261105-101500.dump --yes
```

- Sans `--yes`, rien n'est modifié (le script affiche la cible et s'arrête).
- La restauration **remplace** les tables du schéma `public`, en une seule transaction : en cas d'échec, aucune modification n'est appliquée.
- Procédure recommandée : (1) sauvegarde de l'état actuel, (2) restauration, (3) `npm run db:status`, (4) vérification du site.
- Pour tester une sauvegarde sans risque, restaurez-la d'abord dans un projet Supabase de test (changez `DATABASE_URL_DIRECT` le temps de l'opération).

Les fichiers médias (Supabase Storage) ont leur propre sauvegarde : procédure ajoutée en phase 5, avec la médiathèque.

## Tests automatisés

```bash
npm test
```

Les tests de validation s'exécutent toujours. Les tests de base de données exigent un **PostgreSQL local jetable** :
définissez `TEST_DATABASE_URL` (connexion à un serveur local, ex. `postgres://postgres:postgres@localhost:5432/postgres`).
Chaque exécution crée une base temporaire, la supprime à la fin, et ne touche à aucune autre base. **Ne pointez jamais cette variable vers la production.**
Sont vérifiés sur un vrai PostgreSQL : migrations (application, idempotence, détection de modification, annulation en cas d'échec), contraintes,
distinction brouillon/publié, intégrité des médias, absence totale d'accès pour les rôles publics Supabase, import du contenu, sauvegarde/restauration.
