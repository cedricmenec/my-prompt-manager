# Rename `@activarium/encrypted-vault` → `@activarium/local-secret-vault`

## Why

Le nom actuel `encrypted-vault` décrit *comment* le package est fait (chiffré) mais pas *où*, *quoi* ni *pourquoi*. Un développeur qui le découvre ne sait pas immédiatement s'il s'agit d'un gestionnaire de secrets générique, d'un store chiffré pour documents, ou d'un KMS. Le vrai domaine du package est : **un coffre local (jamais de serveur) pour des secrets — clés API de providers, credentials — déverrouillé par passphrase**. Le nom `local-secret-vault` encode les trois axes de cette promesse (*local* / *secret* / *vault*) et reste valide quand d'autres mécanismes d'ouverture (WebAuthn, biométrie) ou d'autres types de secrets viendront s'ajouter.

## What Changes

- **BREAKING** — Renommage du package npm : `@activarium/encrypted-vault` → `@activarium/local-secret-vault` (nom dans `package.json`, chemins d'import : `/core`, `/storage/indexeddb`, `/storage/memory`, `/react`).
- Renommage du dossier `packages/encrypted-vault/` → `packages/local-secret-vault/`.
- Mise à jour de tous les imports de l'application (`src/**`) et des fichiers de config (workspace, tsconfig, vite) qui référencent le package.
- Renommage des capacités OpenSpec : `encrypted-vault`, `encrypted-vault-core`, `encrypted-vault-react`, `encrypted-vault-storage-indexeddb` → `local-secret-vault*`, avec mise à jour de `openspec/config.yaml` et des références au nom du package dans le texte des specs.
- Mise à jour du README du package et des références dans `README.md` / `deferred-features.md` le cas échéant.
- **Non-change (décision)** : le nom persisté en IndexedDB (`encryptedVault` object store, base `byo-prompt-manager`) **n'est pas renommé** — le renommage ne doit pas casser les données existantes des utilisateurs. Aucune migration de données.

## Capabilities

### New Capabilities

<!-- Aucune. -->

### Modified Capabilities

<!-- Aucune — aucun requirement de comportement ne change. Le renommage est
     purement identifiant/nommage : les exigences (cycle de vie du vault,
     chiffrement, session TTL, storage pluggable, bindings React) sont
     strictement identiques. -->

## Specs : skip délibéré

Ce change est un **refactor de nommage pur** : aucun comportement, aucune exigence ne change. Les specs décrivent le comportement, qui reste identique — seul le nom du package et le nom des capacités changent. `skip_specs: true` est donc posé dans `.openspec.yaml` ; le renommage des dossiers de specs et des références au package dans leur texte est tracké dans `tasks.md`.

## Impact

- **Code** : `packages/encrypted-vault/**` (dossier renommé), imports dans `src/` (notamment `src/infrastructure/aiProviderSettingsRepository*`, settings/vault features), `package.json` racine (workspace), `tsconfig.*.json`, `vite.config.ts`.
- **Specs** : 4 capacités renommées + `openspec/config.yaml` mis à jour.
- **Docs** : `packages/*/README.md`, `README.md` racine, `deferred-features.md`.
- **Utilisateurs finaux** : aucun impact fonctionnel ni perte de données (le schéma IndexedDB est inchangé).
- **Consommateurs du package** : rupture d'import pour tout code externe utilisant `@activarium/encrypted-vault` (aujourd'hui uniquement l'app elle-même — pas de consommateur externe connu).
