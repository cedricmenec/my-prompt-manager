# Tasks — document-local-secret-vault

## 1. Préparation

- [x] 1.1 Appliquer le workflow d'inventaire du skill `library-docs-writer` : lister la surface publique réelle (`src/index.ts`, `src/core/index.ts`, `src/storage/indexeddb.ts`, `src/storage/memory.ts`, `src/react/index.ts`) pour servir de source de vérité aux pages suivantes

## 2. Quickstart

- [x] 2.1 Écrire `docs/quickstart.md` : install → `createVault` → `create(passphrase)` → `tryAutoUnlock`/`unlock` → lire/écrire le payload → `lock()`, avec un exemple générique (aucun nom lié à `my-prompt-manager`)

## 3. Concepts

- [x] 3.1 Écrire `docs/concepts.md` : modèle local-first (pas de serveur), chiffrement PBKDF2 + AES-256-GCM en langage simple, cache de session et TTL (`Disabled`/15 min/1 h/4 h/Session), modèle de storage pluggable (`VaultStorage`), taxonomie d'erreurs (`VaultError` et ses 4 sous-types)

## 4. Guides pratiques (how-to)

- [x] 4.1 Écrire `docs/how-to/use-without-react.md` (usage du core seul, sans dépendance React)
- [x] 4.2 Écrire `docs/how-to/custom-storage-backend.md` (implémenter `VaultStorage` pour un backend personnalisé)
- [x] 4.3 Écrire `docs/how-to/change-passphrase-and-export-import.md` (`changePassphrase`, `export`/`import`)
- [x] 4.4 Écrire `docs/how-to/configure-session-ttl.md` (`getSessionTTL`/`setSessionTTL`, compromis sécurité/confort)

## 5. Référence API

- [x] 5.1 Écrire `docs/api-reference.md` : méthodes de `Vault<TPayload>`, entry points (`/core`, `/storage/indexeddb`, `/storage/memory`, `/react`), types exportés, erreurs, composants et hooks React — vérifiés contre les signatures réelles du code

## 6. Point d'entrée

- [x] 6.1 Réécrire `packages/local-secret-vault/README.md` en point d'entrée court (pitch, install, un exemple minimal, liens vers les pages `docs/`, licence), sans référence à `my-prompt-manager`/`byo-prompt-manager`

## 7. Vérification

- [x] 7.1 Grep exhaustif sur `packages/local-secret-vault/docs/**` et `README.md` : aucune occurrence de `my-prompt-manager`, `byo-prompt-manager`, ou d'un chemin/nom spécifique à l'app hôte
- [x] 7.2 Relecture manuelle de chaque exemple de code : imports complets, types cohérents avec les signatures réelles, aucune variable non définie
- [x] 7.3 `pnpm --filter @activarium/local-secret-vault typecheck` — confirme qu'aucun changement de code n'a été introduit par erreur (doc-only)
- [x] 7.4 Valider le change (`openspec validate document-local-secret-vault` si l'environnement le permet, sinon relecture structurelle manuelle des artefacts)
