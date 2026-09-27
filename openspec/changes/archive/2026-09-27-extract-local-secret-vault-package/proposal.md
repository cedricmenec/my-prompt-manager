## Why

Le package `packages/local-secret-vault` a été développé comme librairie interne du monorepo `my-prompt-manager`, mais il est conçu pour vivre sa propre vie : SDK autonome, documentation dédiée, publication npm prévue. Le maintenir dans le monorepo le couple inutilement à une application consommatrice et freine son évolution indépendante (versioning, issues, CI, publication).

## What Changes

- Créer un repository Git dédié : `github.com/cedricmenec/local-secret-vault`, cloné localement dans `D:\Projects\Development\local-secret-vault\`.
- Migrer le contenu du package (src, docs, LICENSE, README) **sans conserver l'historique git** du package.
- Rendre le nouveau repo totalement autonome :
  - Supprimer toute dépendance implicite au monorepo (`workspace:*`, imports frères, tsconfig hérité, configs ESLint/Vitest partagées, scripts racine, variables d'environnement, outillage racine).
  - Ajouter l'outillage standalone : `eslint.config.js` propre, script `lint`, `.gitignore`, `package-lock.json` (npm, pas pnpm).
  - Ajouter une CI GitHub Actions (lint + test + build sur chaque PR/push).
  - Compléter le `package.json` pour la publication npm : `repository`, `bugs`, `homepage`, `author`, `publishConfig`.
- Conserver le nom npm `@activarium/local-secret-vault` (l'organisation `activarium` appartient à l'utilisateur sur npm).
- Côté `my-prompt-manager` :
  - **BREAKING** : supprimer `packages/local-secret-vault` du monorepo et le retirer de `pnpm-workspace.yaml`.
  - Remplacer la dépendance `workspace:*` par `file:../local-secret-vault` (option B, transition jusqu'à la publication npm).
  - Ajouter une note dans le README du nouveau repo rappelant de basculer la consommation vers la version npm publiée dès qu'elle sera disponible.
- Mettre à jour les scripts racine du monorepo (`build:vault` supprimé ou adapté).

## Capabilities

### New Capabilities

- `package-extraction`: exigences couvrant l'extraction du package dans un repo autonome — autonomie du clone neuf (install/lint/test/build), outillage standalone, CI, préparation publication npm, et transition de consommation côté monorepo.

### Modified Capabilities

- `local-secret-vault`: le package n'est plus un workspace du monorepo ; il est consommé via dépendance de fichier locale (`file:`) en attendant la publication npm. Les exigences d'intégration (imports `@activarium/local-secret-vault/*`) restent inchangées, mais la provenance du package change.

## Impact

- **Nouveau repo** : `D:\Projects\Development\local-secret-vault\` → `github.com/cedricmenec/local-secret-vault`.
- **Monorepo** : `package.json` (dépendance + scripts), `pnpm-workspace.yaml`, suppression de `packages/local-secret-vault/`, `pnpm-lock.yaml` régénéré.
- **Code consommateur** : aucun changement d'imports nécessaire (`@activarium/local-secret-vault/*` conservé) — seule la résolution de la dépendance change.
- **CI** : nouveau workflow GitHub Actions dans le repo extrait.
- **Publication npm** : préparée (métadonnées complètes) mais non effectuée dans ce changement.
