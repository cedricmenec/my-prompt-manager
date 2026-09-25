# Documentation développeur pour `local-secret-vault`

## Why

`local-secret-vault` (`@activarium/local-secret-vault`) va être externalisé dans un package npm indépendant (extraction déjà préparée par les changes `extract-encrypted-vault-sdk` et `rename-local-secret-vault` archivés). Sa seule documentation aujourd'hui est un `README.md` unique, correct sur la forme mais écrit du point de vue d'un contributeur du monorepo — pas structuré pour un développeur externe qui découvre la librairie sans aucun contexte sur `my-prompt-manager`. Avant l'externalisation, le package a besoin d'une documentation développeur autonome, en anglais simplifié, qui tienne comme si elle vivait déjà dans son propre dépôt.

## What Changes

- Nouveau dossier `packages/local-secret-vault/docs/` avec des pages focalisées (quickstart, concepts, guides pratiques, référence API), en anglais simplifié, rédigées selon le skill `library-docs-writer`.
- `packages/local-secret-vault/README.md` réécrit en point d'entrée court (pitch, install, un exemple minimal, liens vers `docs/`) — plus de tableau d'API exhaustif dans le README, déplacé dans la référence.
- Suppression de toute référence à `my-prompt-manager`, `byo-prompt-manager` ou à l'architecture de l'app hôte : le package est documenté comme une librairie 100% découplée (« your app », noms génériques).
- **Non-change** : aucune modification de code, d'API publique, de comportement ou de dépendance du package.

## Capabilities

### New Capabilities

<!-- Aucune — travail de documentation, pas de nouvelle capacité produit. -->

### Modified Capabilities

<!-- Aucune — les exigences comportementales du package (cycle de vie du vault, chiffrement, session TTL, storage pluggable, bindings React) ne changent pas. -->

## Specs : skip délibéré

Ce change ne modifie que de la documentation (fichiers Markdown) — aucun comportement du package ne change, donc aucune spec ne doit changer. `skip_specs: true` est posé dans `.openspec.yaml`, cohérent avec le change `rename-local-secret-vault` qui a suivi le même raisonnement.

## Impact

- **Nouveaux fichiers** : `packages/local-secret-vault/docs/quickstart.md`, `docs/concepts.md`, `docs/how-to/*.md`, `docs/api-reference.md`.
- **Fichier modifié** : `packages/local-secret-vault/README.md`.
- **Aucun** changement de code (`src/**`), de `package.json`, de build, ou de specs OpenSpec.
- **Dépendance douce** : applique la méthodologie du skill `library-docs-writer` (change `add-library-docs-writer-skill`) — à créer avant ou en même temps, mais aucune dépendance technique OpenSpec formelle entre les deux changes.
