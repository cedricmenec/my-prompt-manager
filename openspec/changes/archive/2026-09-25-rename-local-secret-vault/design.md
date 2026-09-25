# Design — Rename `@activarium/encrypted-vault` → `@activarium/local-secret-vault`

## Context

Voir proposal.md — Why. Contexte technique seulement :

- Package workspace (`pnpm-workspace.yaml`), consommé uniquement par l'app (`src/infrastructure/vault/**`, `src/features/vault/**`). Aucun consommateur externe.
- 56 références `@activarium/encrypted-vault` dans 26 fichiers (imports, comments, README, `package.json` racine, `pnpm-lock.yaml`).
- 4 capacités OpenSpec (`openspec/specs/encrypted-vault*`) + `openspec/config.yaml` les listant.
- Précedent direct : change archivé `2026-09-25-rename-vault-namespace` (`@byo-prompt/encrypted-vault` → `@activarium/encrypted-vault`) — même type d'opération, mêmes fichiers touchés, même schéma de tasks.
- Persistance IndexedDB : object store `encryptedVault` dans la base `byo-prompt-manager`, géré par le plugin storage du SDK.

## Goals / Non-Goals

**Goals:**
- Renommer le package, le dossier, tous les imports et les références docs d'un bloc, sans régression.
- Renommer les 4 capacités OpenSpec + `config.yaml` pour rester cohérentes avec le nom du package.
- Vérification objective : typecheck + tests + build passent après le renommage.

**Non-Goals:**
- Aucun changement de comportement, d'API publique (exports), ni de format de données.
- Pas de migration IndexedDB — le nom de l'object store `encryptedVault` et de la base restent inchangés.
- Pas de publication npm (package non publié, workspace uniquement).
- Pas de renommage des symboles code (`Vault`, `createVault`, `VaultGate`…) — ils sont déjà génériques et indépendants du nom de package.

## Decisions

### D1 — Ordre : dossier d'abord, puis références

Renommer `packages/encrypted-vault/` → `packages/local-secret-vault/` (git mv) avant de éditer les références, pour que les recherches/replace partent d'un état cohérent et qu'une seule passe de remplacement suffise.

*Alternative* : éditer les références d'abord — rejetée, on garde un état intermédiaire cassé plus longtemps.

### D2 — Remplacement par recherche globale exhaustive, pas à la main

Une passe `encrypted-vault` → `local-secret-vault` sur tout le dépôt (hors `openspec/changes/archive/**` — l'archive est un journal historique qui ne se réécrit pas), puis une passe ciblée `@activarium/encrypted-vault` → `@activarium/local-secret-vault` pour le nom npm complet. Vérification finale par grep : plus aucune occurrence hors archive.

Cas particuliers à traiter séparément (ne matchent pas le pattern simple) :
- `package.json` racine : dépendance `workspace:*` + script `build:vault` (le script garde son nom `build:vault` — il décrit l'action, pas le package ; seul son `--filter` change).
- `pnpm-lock.yaml` : régénéré par `pnpm install`, pas édité à la main.
- `openspec/config.yaml` : liste `specs:` mise à jour avec les nouveaux chemins de capacités.

### D3 — Renommage des capacités OpenSpec = déplacement + édition, pas de delta

Les specs sont skip (`skip_specs: true`, aucun requirement ne change). Le renommage se fait par `git mv` des 4 dossiers `openspec/specs/encrypted-vault*` → `local-secret-vault*`, puis remplacement des références au nom du package dans leur texte. `openspec/config.yaml` suit.

*Alternative* : laisser les noms de capacités inchangés — rejetée, le nom de la capacité est le contrat de nommage du domaine ; le garder en `encrypted-vault` perpétue exactement la confusion que ce change veut résoudre.

### D4 — Le schéma persisté ne bouge pas

L'object store `encryptedVault` (base `byo-prompt-manager`) conserve son nom. Renommer le store détruirait/isoilerait les coffres existants des utilisateurs. Le commentaire dans `src/infrastructure/db.ts:162` qui référence le package SDK est mis à jour (texte), pas le code de migration.

### D5 — Vérification comme garde-fou

Après le renommage : `pnpm install` (lockfile), `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:vault` + build app. Le change n'est terminé que si tout passe — un import raté se manifesterait au typecheck.

## Risks / Trade-offs

- [Une référence au nom du package subsiste et casse un import en runtime] → vérification grep exhaustive finale + typecheck + tests ; l'archive `openspec/changes/archive/**` est le seul emplacement autorisé à garder l'ancien nom.
- [Rupture pour consommateurs externes] → aucun consommateur externe connu (package non publié) ; rupture acceptée et marquée **BREAKING** dans la proposal.
- [Conflit git sur le git mv du dossier + éditions simultanées] → une seule branche, commits séparés : (1) git mv + références code, (2) références docs/specs, ou un commit unique atomique — l'état final est ce qui compte, pas l'intermédiaire.
- [Confusion pendant la transition si le change traîne ouvert] → change court à faible risque, à appliquer en une séance.

## Migration Plan

1. `git mv packages/encrypted-vault packages/local-secret-vault`
2. Remplacements de références (code + config + docs, hors archive)
3. `git mv` des 4 dossiers de specs + mise à jour `config.yaml` et texte des specs
4. `pnpm install` (lockfile) puis typecheck / tests / build
5. Commit unique. Rollback : `git revert` (aucune donnée utilisateur en jeu).

## Open Questions

<!-- Aucune. -->
