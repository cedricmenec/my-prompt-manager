## 1. Scaffolding du nouveau repository

- [x] 1.1 Créer `D:\Projects\Development\local-secret-vault\`, initialiser git (`git init`, branche `main`)
- [x] 1.2 Copier `src/`, `docs/`, `LICENSE`, `README.md` depuis `packages/local-secret-vault` (sans `dist/`, `node_modules/`, `pnpm-workspace.yaml`)
- [x] 1.3 Écrire le nouveau `package.json` : nom `@activarium/local-secret-vault`, scripts `build`/`dev`/`test`/`test:watch`/`typecheck`/`lint`, métadonnées npm (`repository`, `bugs`, `homepage`, `author`, `files`, `exports`, `publishConfig.access: "public"`)
- [x] 1.4 Copier `tsconfig.json` et `vite.config.ts` (déjà autonomes, vérifier qu'aucun chemin ne référence le monorepo)
- [x] 1.5 Écrire `eslint.config.js` standalone (flat config TypeScript + React + tests) et ajouter les devDependencies ESLint
- [x] 1.6 Écrire `.gitignore` (`dist/`, `node_modules/`, couverture, éditeurs)

## 2. Validation du clone neuf

- [x] 2.1 Exécuter `npm install` et générer `package-lock.json`
- [x] 2.2 Valider `npm run lint` (zéro erreur)
- [x] 2.3 Valider `npm test` (tous les tests du SDK passent)
- [x] 2.4 Valider `npm run build` (artefacts `dist/` conformes aux entry points)
- [x] 2.5 Valider `npm publish --dry-run` (métadonnées complètes, fichiers corrects)

## 3. README et note de migration

- [x] 3.1 Mettre à jour le README : installation npm, développement local, CI
- [x] 3.2 Ajouter la note de migration : basculer la consommation du monorepo de `file:` vers la version npm publiée dès publication

## 4. CI GitHub Actions

- [x] 4.1 Écrire `.github/workflows/ci.yml` : push + pull_request sur `main`, Node 22, `npm ci` → `lint` → `test` → `build`

## 5. Publication du repository GitHub

- [x] 5.1 Commit initial, créer le repo `cedricmenec/local-secret-vault` sur GitHub, ajouter le remote, push
- [x] 5.2 Vérifier que le workflow CI est vert sur le premier push

## 6. Migration du monorepo my-prompt-manager

- [x] 6.1 Supprimer `packages/local-secret-vault/` du monorepo
- [x] 6.2 Retirer le package de `pnpm-workspace.yaml`
- [x] 6.3 Remplacer `"@activarium/local-secret-vault": "workspace:*"` par `"file:../local-secret-vault"` dans le `package.json` racine
- [x] 6.4 Supprimer ou adapter le script racine `build:vault`
- [x] 6.5 Régénérer le lockfile pnpm (`pnpm install`)
- [x] 6.6 Valider le monorepo : lint, tests, build de l'application (imports `@activarium/local-secret-vault/*` inchangés)
