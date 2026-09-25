# Design — Documentation développeur pour `local-secret-vault`

## Context

Voir proposal.md — Why. Contexte technique seulement :

- Surface publique actuelle (`src/index.ts`, `src/core/index.ts`, `src/storage/*`, `src/react/index.ts`) : `Vault` / `createVault`, session TTL (`getTTLConfig`/`setTTLConfig`), types (`VaultPayloadBase`, `VaultSDKOptions`, `EncryptedRecord`, `ExportableVault`, `VaultStorage`), erreurs (`VaultError` + 4 sous-types), primitives crypto exposées (`isWebCryptoAvailable`, `generateSalt`, `generateIv`, `deriveKey`, `deriveVerifyHash`, `encrypt`, `decrypt`, `arraysEqual`), session (`storeSessionPassphrase`, `tryGetSessionPassphrase`, `clearSessionCache`), storage (`createIndexedDbStorage`, `createMemoryStorage`), et 5 exports React (`useVault`, `VaultGate`, `VaultCreateModal`, `VaultUnlockModal`, `VaultSettings`).
- Le `README.md` actuel (lu intégralement pendant l'exploration) couvre déjà install/usage/entry points/API/erreurs/composants React en un seul document plat, avec un ton correct mais quelques traces monorepo implicites (aucune référence directe à `my-prompt-manager` trouvée dans le texte, mais aucune séparation quickstart/concepts/référence non plus).
- Ce change applique directement la structure et les règles de style définies par le skill `library-docs-writer` (change `add-library-docs-writer-skill`).

## Goals / Non-Goals

**Goals:**
- Un développeur externe sans aucun contexte sur `my-prompt-manager` peut, en lisant uniquement `docs/quickstart.md`, installer le package et déverrouiller un premier vault en moins de 5 minutes.
- Les concepts qui ne se comprennent pas au fil de l'eau (dérivation de clé, cache de session/TTL, modèle de storage pluggable, taxonomie d'erreurs) sont expliqués une seule fois dans `docs/concepts.md`, et référencés ailleurs plutôt que répétés.
- Des guides pratiques pour les tâches réelles qu'un intégrateur rencontre : utiliser le core sans React, écrire un backend de storage personnalisé, changer de passphrase / exporter-importer, configurer le TTL de session.
- Une référence API complète et exacte (signatures réelles lues dans `src/core/*.ts`, `src/storage/*.ts`, `src/react/*.tsx`), pas une paraphrase approximative.
- Zéro référence à `my-prompt-manager`, `byo-prompt-manager`, ou à l'architecture de l'app hôte — la doc doit rester valide telle quelle après extraction du package dans son propre dépôt.

**Non-Goals:**
- Pas de changement de code, de type, de comportement ou de nom d'export — documentation uniquement, aucune divergence avec le code réel n'est acceptable.
- Pas de génération automatique (TypeDoc) — pages Markdown écrites à la main.
- Pas de traduction française — les pages `docs/**` et le `README.md` du package sont entièrement en anglais simplifié (contrairement aux artefacts OpenSpec de ce repo, qui restent en français).
- Pas de documentation du store IndexedDB interne au-delà de ce qui est déjà un contrat public (nom de la table par défaut, format exporté) — le détail d'implémentation du plugin storage par défaut reste dans le code, pas dans les guides.

## Decisions

### D1 — Emplacement : `packages/local-secret-vault/docs/`, pas un dossier racine

Toute la documentation reste colocalisée avec le package, pour que le dossier `packages/local-secret-vault/` puisse être extrait tel quel dans son futur dépôt indépendant sans qu'il faille aller chercher des fichiers ailleurs dans le monorepo.

*Alternative* : documentation dans un `/docs` racine du monorepo — rejetée, casserait au moment de l'extraction et mélangerait la doc du package avec celle de l'app.

### D2 — Structure à 4 pages + README d'entrée (suit le skill `library-docs-writer`)

- `docs/quickstart.md` — install → create → unlock → read/write payload → lock, linéaire, < 10 étapes.
- `docs/concepts.md` — modèle local-first, chiffrement (PBKDF2 + AES-256-GCM) expliqué en termes simples (sans formalisme crypto inutile), cache de session/TTL, modèle de storage pluggable, taxonomie d'erreurs.
- `docs/how-to/*.md` — un fichier par recette : usage sans React, backend de storage personnalisé, changer de passphrase + export/import, configurer le TTL de session.
- `docs/api-reference.md` — table exhaustive : méthodes de `Vault`, entry points (`/core`, `/storage/indexeddb`, `/storage/memory`, `/react`), types, erreurs, options de config.
- `README.md` — pitch (1 phrase), install, un exemple minimal (~15 lignes), liens vers les 4 pages ci-dessus, licence. Le tableau d'API exhaustif actuel du README est déplacé vers `docs/api-reference.md` (pas dupliqué).

*Alternative* : garder un unique README enrichi — rejetée (cf. design.md du change `add-library-docs-writer-skill`, D1) : mélange quickstart/référence illisible dès que la surface d'API dépasse une poignée de fonctions, ce qui est déjà le cas ici.

### D3 — Neutralisation explicite des références monorepo

Chaque exemple de code utilise des noms génériques (`myApp`, `MyPayload`, `'my-app'` pour `dbName`) plutôt que ceux réellement utilisés dans `my-prompt-manager` (`byo-prompt-manager`, `apiKeys`/providers spécifiques). La doc explique le nom de store IndexedDB par défaut (`encryptedVault`, cf. décision D4 du change `rename-local-secret-vault`) comme un simple exemple de configuration, pas comme une référence à l'app hôte.

### D4 — La référence API documente le code réel, pas une simplification

Chaque entrée de `docs/api-reference.md` est vérifiée contre la signature réelle dans `src/core/vault.ts`, `src/core/types.ts`, `src/core/errors.ts`, `src/storage/indexeddb.ts`, `src/storage/memory.ts`, `src/react/*.tsx` au moment de la rédaction — pas recopiée depuis l'ancien README sans vérification, pour éviter de perpétuer une éventuelle dérive déjà présente.

## Risks / Trade-offs

- [La doc diverge du code au fil des évolutions futures du package] → atténué procéduralement par la checklist de maintenance du skill `library-docs-writer` ; ce change ne peut garantir que l'état initial est exact, pas l'avenir.
- [Trop de pages fragmentent l'information et nuisent à la découvrabilité] → le README d'entrée sert de table des matières unique ; chaque page `how-to` reste courte et autonome.
- [Exemples de code qui ne compilent pas réellement] → relecture manuelle systématique de chaque snippet contre les types réels du package (tâche de vérification dédiée).

## Migration Plan

Aucune migration : ajout de fichiers de documentation + réécriture d'un README existant, aucun impact sur le code, les données ou les consommateurs actuels. Rollback trivial : `git revert`.

## Open Questions

<!-- Aucune — la liste exacte des guides how-to (4) est fixée dans tasks.md ; elle peut être ajustée pendant l'implémentation si un cas d'usage s'avère hors-sujet, sans changer l'approche. -->
