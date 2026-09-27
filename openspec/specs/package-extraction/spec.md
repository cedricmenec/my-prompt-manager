# Package Extraction

## Purpose

Gouverne l'extraction du package `@activarium/local-secret-vault` du monorepo `my-prompt-manager` vers un repository Git autonome (`github.com/cedricmenec/local-secret-vault`), avec outillage standalone, CI GitHub Actions, préparation de la publication npm, et transition de consommation côté monorepo via dépendance de fichier locale.

## Requirements

### Requirement: Repository autonome pour le package
Le package `@activarium/local-secret-vault` SHALL vivre dans un repository Git dédié (`github.com/cedricmenec/local-secret-vault`), cloné localement dans `D:\Projects\Development\local-secret-vault\`, sans conserver l'historique git du package issu du monorepo.

#### Scenario: Clone neuf fonctionnel
- **WHEN** un utilisateur clone le repository et exécute `npm ci`, `npm run lint`, `npm test`, puis `npm run build`
- **THEN** chaque commande réussit sans aucune étape préalable hors du repository
- **AND** le build produit les artefacts `dist/` conformes aux entry points déclarés dans `package.json`

#### Scenario: Aucune dépendance implicite au monorepo
- **WHEN** le repository est inspecté
- **THEN** il ne contient aucun `workspace:*`, aucun import vers un package frère, aucun `tsconfig` étendant un fichier hors du repository, aucune configuration ESLint/Vitest partagée avec le monorepo, aucun script exécuté depuis la racine du monorepo, et aucune variable d'environnement du monorepo

### Requirement: Outillage standalone du package
Le repository extrait SHALL embarquer son propre outillage : configuration ESLint autonome, script `lint` dans `package.json`, `.gitignore` excluant `dist/` et `node_modules/`, et un lockfile npm (`package-lock.json`) généré par `npm install`.

#### Scenario: Lint exécutable depuis le repository
- **WHEN** `npm run lint` est exécuté à la racine du repository extrait
- **THEN** ESLint analyse le code source avec une configuration définie dans le repository lui-même et se termine avec succès

#### Scenario: Installation via npm
- **WHEN** `npm ci` est exécuté dans un clone neuf
- **THEN** les dépendances sont installées à partir du `package-lock.json` sans nécessiter pnpm ni le workspace du monorepo

### Requirement: CI GitHub Actions
Le repository extrait SHALL définir un workflow GitHub Actions qui exécute lint, tests et build sur chaque push et pull request.

#### Scenario: CI verte sur push
- **WHEN** un commit est poussé sur le repository
- **THEN** le workflow GitHub Actions exécute `npm ci`, `npm run lint`, `npm test` et `npm run build`
- **AND** le workflow échoue si l'une de ces étapes échoue

### Requirement: Métadonnées de publication npm
Le `package.json` du repository extrait SHALL contenir les métadonnées nécessaires à une publication npm : `name` (`@activarium/local-secret-vault`), `version`, `description`, `license`, `repository`, `bugs`, `homepage`, `author`, `files`, `exports`, et `publishConfig` avec accès public pour le scope.

#### Scenario: Package prêt pour npm publish
- **WHEN** `npm publish --dry-run` est exécuté dans le repository extrait
- **THEN** la commande réussit et liste uniquement les fichiers autorisés par le champ `files`

### Requirement: Transition de consommation côté monorepo
Le monorepo `my-prompt-manager` SHALL consommer le package via une dépendance de fichier locale (`file:../local-secret-vault`) en attendant la publication npm, et le README du repository extrait SHALL contenir une note rappelant de basculer vers la dépendance npm publiée dès qu'elle sera disponible.

#### Scenario: Monorepo consomme le package local
- **WHEN** `pnpm install` est exécuté dans le monorepo après suppression de `packages/local-secret-vault`
- **THEN** la dépendance `@activarium/local-secret-vault` est résolue depuis `file:../local-secret-vault`
- **AND** les imports `@activarium/local-secret-vault/*` de l'application continuent de fonctionner sans modification

#### Scenario: Note de migration dans le README
- **WHEN** le README du repository extrait est consulté
- **THEN** il contient une note explicite indiquant que le monorepo doit basculer de `file:` vers la version npm publiée dès que le package sera publié

### Requirement: Retrait du package du monorepo
Le monorepo SHALL supprimer le répertoire `packages/local-secret-vault`, retirer le package de `pnpm-workspace.yaml`, et retirer ou adapter les scripts racine qui y faisaient référence (ex. `build:vault`).

#### Scenario: Workspace nettoyé
- **WHEN** le monorepo est inspecté après la migration
- **THEN** `packages/local-secret-vault` n'existe plus, `pnpm-workspace.yaml` ne référence plus le package, et aucun script racine ne cible le package
- **AND** le lockfile pnpm est régénéré sans référence au package workspace