## Context

Le package `packages/local-secret-vault` est déjà quasi autonome : `package.json` sans `workspace:*` interne, `tsconfig.json` sans `extends` parent, `vite.config.ts` (Vitest + vite-plugin-dts) autoportant, imports internes tous relatifs. Le couplage résiduel est externe : dépendance `workspace:*` dans le `package.json` racine du monorepo, script racine `build:vault`, appartenance à `pnpm-workspace.yaml`, et absence d'outillage propre (pas d'ESLint, pas de script `lint`, pas de `.gitignore`, pas de CI). Voir proposal.md pour la motivation.

## Goals / Non-Goals

**Goals:**
- Repo neuf `D:\Projects\Development\local-secret-vault\` → `github.com/cedricmenec/local-secret-vault`, clone 100 % autonome (`npm ci` / `lint` / `test` / `build`).
- Outillage standalone : ESLint, `.gitignore`, lockfile npm, CI GitHub Actions.
- Métadonnées npm complètes pour une future publication (`@activarium/local-secret-vault`).
- Transition de consommation côté monorepo via `file:` sans casser les imports existants.

**Non-Goals:**
- Publier réellement sur npm (préparation seulement).
- Conserver l'historique git du package (démarrage à neuf, commit initial).
- Modifier le comportement du SDK (aucun changement de code source prévu).
- Migrer le monorepo vers npm (il reste sous pnpm).

## Decisions

**D1 — Copie simple, pas de `git filter-repo`.** L'utilisateur ne veut pas de l'historique : une copie des fichiers (src, docs, LICENSE, README) suivie d'un commit initial suffit. Alternative rejetée : `git filter-repo` pour extraire l'historique — inutile ici et plus risqué.

**D2 — npm comme gestionnaire de paquets du repo extrait.** Le monorepo reste pnpm, mais le package vit seul : npm est le standard le plus neutre pour une lib publiée, et la checklist de validation (`npm ci`) l'exige. Le `pnpm-workspace.yaml` du package (avec `allowBuilds`) n'est pas emporté. Alternative rejetée : garder pnpm — ajouterait une dépendance outil sans bénéfice pour un repo mono-package.

**D3 — ESLint standalone avec flat config.** Repartir du `eslint.config.js` du monorepo comme base, en le réduisant au strict nécessaire pour le package (TypeScript + React + tests), avec ses propres devDependencies (`eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`). Alternative rejetée : partager la config via un package — recréerait le couplage qu'on supprime.

**D4 — Consommation `file:../local-secret-vault` (option B).** Permet au monorepo de fonctionner immédiatement sans publication npm. Le chemin relatif suppose que les deux repos sont clonés côte à côte dans `D:\Projects\Development\`. Alternative rejetée : `npm i github:...` — plus lent et fragile en CI ; `link:` — moins portable. Une note dans le README du repo extrait rappellera la bascule vers npm après publication.

**D5 — CI GitHub Actions unique.** Un workflow `ci.yml` : `npm ci` → `lint` → `test` → `build` sur Node 22, déclenché sur push et pull_request vers `main`. La publication npm (quand elle viendra) sera un workflow séparé, non inclus ici.

**D6 — Nom npm inchangé.** `@activarium/local-secret-vault` est conservé (l'organisation `activarium` appartient à l'utilisateur sur npm). `publishConfig.access: "public"` est requis pour un package scopé. Les imports consommateurs (`@activarium/local-secret-vault/*`) restent donc identiques.

**D7 — `dist/` et `node_modules/` non migrés.** Artefacts régénérables ; le `.gitignore` du nouveau repo les exclut.

## Risks / Trade-offs

- [Le chemin `file:../local-secret-vault` casse si le repo extrait n'est pas cloné au même niveau] → Documenté dans le README du monorepo ; la bascule vers npm publiera supprimera ce fragilité.
- [Résolution `file:` et peer deps React] → pnpm résout les peerDependencies du package depuis le monorepo ; vérifier après `pnpm install` que les tests de l'app passent.
- [Divergence ESLint entre monorepo et repo extrait] → Accepté : règles volontairement minimales dans le repo extrait ; les deux configs évolueront indépendamment.
- [Lockfile npm vs versions pnpm] → `npm install` régénère un arbre de dépendances équivalent ; les tests valident la compatibilité.
- [Oubli de la bascule `file:` → npm] → Note explicite dans le README du repo extrait (exigence de spec) + tâche dédiée.

## Migration Plan

1. Créer `D:\Projects\Development\local-secret-vault\`, init git, copier src/docs/LICENSE/README, écrire package.json/tsconfig/vite.config/eslint.config.js/.gitignore/CI.
2. `npm install` → lockfile ; valider `npm run lint`, `npm test`, `npm run build`.
3. Commit initial, créer le repo GitHub `cedricmenec/local-secret-vault`, push.
4. Côté monorepo : supprimer `packages/local-secret-vault`, retirer de `pnpm-workspace.yaml`, remplacer la dépendance par `file:../local-secret-vault`, adapter/supprimer `build:vault`, régénérer le lockfile pnpm.
5. Valider le monorepo : `pnpm install`, lint, tests, build de l'app.
6. Rollback : le monorepo conserve son historique git — restaurer `packages/local-secret-vault` depuis git et revenir à `workspace:*`.

## Open Questions

Aucune — les décisions structurantes (nom npm, option B, CI, dossier local) ont été arrêtées avec l'utilisateur.
