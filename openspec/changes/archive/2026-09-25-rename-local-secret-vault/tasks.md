# Tasks — rename-local-secret-vault

## 1. Renommage du package

- [x] 1.1 `git mv packages/encrypted-vault packages/local-secret-vault`
- [x] 1.2 Renommer le `name` dans `packages/local-secret-vault/package.json` → `@activarium/local-secret-vault` (description aussi)
- [x] 1.3 Mettre à jour la dépendance workspace et le filtre du script `build:vault` dans le `package.json` racine
- [x] 1.4 Ajouter `packages/local-secret-vault` au `pnpm-workspace.yaml` si le chemin y est référencé explicitement

## 2. Imports et code applicatif

- [x] 2.1 Remplacer `@activarium/encrypted-vault` → `@activarium/local-secret-vault` dans tous les imports/exports de `src/` (`src/infrastructure/vault/**`, `src/features/vault/**`, `src/infrastructure/db.ts`)
- [x] 2.2 Mettre à jour les commentaires/docs-inline du package (`packages/local-secret-vault/src/**` : header `@activarium/encrypted-vault` dans `index.ts`, `core/index.ts`, `react/index.ts`)
- [x] 2.3 Vérifier `tsconfig.*.json` et `vite.config.ts` (racine et package) pour toute référence au chemin `packages/encrypted-vault`

## 3. Specs OpenSpec

- [x] 3.1 `git mv` des 4 dossiers `openspec/specs/encrypted-vault*` → `openspec/specs/local-secret-vault*` (`-core`, `-react`, `-storage-indexeddb`, racine)
- [x] 3.2 Remplacer les références `@activarium/encrypted-vault` → `@activarium/local-secret-vault` dans le texte des 4 specs déplacées (et `encryptedVault` → garder tel quel pour l'object store IndexedDB, D4)
- [x] 3.3 Mettre à jour la liste `specs:` dans `openspec/config.yaml` avec les 4 nouveaux chemins
- [x] 3.4 Mettre à jour `openspec/project.md` (lignes Encryption et arborescence)

## 4. Documentation

- [x] 4.1 Renommer le titre, les imports et le tableau des entry points de `packages/local-secret-vault/README.md`
- [x] 4.2 Mettre à jour `README.md` racine (arborescence + lien vers le guide du package)
- [x] 4.3 Vérifier `deferred-features.md` pour des références au package et les mettre à jour

## 5. Vérifications

- [x] 5.1 `pnpm install` pour régénérer le `pnpm-lock.yaml`
- [x] 5.2 Grep exhaustive : plus aucune occurrence de `encrypted-vault` hors `openspec/changes/archive/**` (corriger les résidus)
- [x] 5.3 `pnpm -r typecheck` — 0 erreur
- [x] 5.4 `pnpm -r test` — tous les tests passent
- [x] 5.5 `pnpm build:vault` puis build de l'app — succès
- [x] 5.6 Valider le change : `openspec validate rename-local-secret-vault`
