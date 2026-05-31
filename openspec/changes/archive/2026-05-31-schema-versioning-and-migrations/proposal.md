## Why

L'application stocke des données utilisateur dans IndexedDB sans mécanisme de suivi des versions de schéma ni de migration automatique des données existantes. Lors d'une évolution du modèle `Prompt` (ajout de champs, changement de type, renommage), les données des utilisateurs existants sont incompatibles sans transformation, ce qui entraîne des bugs silencieux ou des pertes de données. La même lacune affecte les fichiers d'export : un fichier créé avec une ancienne version de l'app peut échouer à l'import sans explication claire.

## What Changes

- Ajout d'un store IndexedDB `_meta` pour stocker `schemaVersion` (entier séquentiel) et `appVersion` (semver injecté depuis `package.json` au build Vite)
- Introduction d'un `dataMigrations` registry et d'un `runDataMigrations()` runner exécuté au démarrage, après l'ouverture de la DB
- L'enveloppe d'export est enrichie : `schema: "v1"` (string opaque) est remplacé par `schemaVersion: number` et `appVersion: string`
- À l'import : avertissement non bloquant si le fichier provient d'une version antérieure de schéma, migration à la volée des données, puis skip des prompts invalides avec message d'erreur clair ; rejet si le fichier est plus récent que la version actuelle
- `appVersion` est injectée dans le bundle via `import.meta.env.VITE_APP_VERSION` (défini dans `vite.config.ts` depuis `process.env.npm_package_version`)

## Capabilities

### New Capabilities
- `db-schema-versioning`: Store `_meta` dans IndexedDB et constante `DATA_SCHEMA_VERSION`; lecture/écriture de `schemaVersion` et `appVersion` au démarrage
- `data-migration-runner`: Registry `dataMigrations[]` et fonction `runDataMigrations(db)` qui applique séquentiellement les migrations de données dont la version est supérieure au `schemaVersion` courant

### Modified Capabilities
- `import-export`: L'enveloppe passe de `schema: "v1"` à `{ schemaVersion: number, appVersion: string }`; import avec détection de version, migration à la volée, warning non bloquant et skip des prompts invalides
- `prompt-repository`: Bump de `DB_VERSION` à `3` pour créer le store `_meta` dans le callback `upgrade`

## Impact

- `src/infrastructure/db.ts` : bump `DB_VERSION`, ajout du store `_meta` dans `upgrade`, exposition d'une fonction `initDb()` appelée au démarrage qui orchestre DB + migrations
- `src/infrastructure/dataMigrations.ts` : nouveau fichier — constante `DATA_SCHEMA_VERSION`, type `DataMigration`, tableau `dataMigrations`, fonction `runDataMigrations`
- `src/infrastructure/importExport.ts` : modification de `ExportEnvelope`, de `exportPromptsToJson`, de `parseImportFile` (logique de version + migration à la volée)
- `vite.config.ts` : ajout de `define` pour injecter `VITE_APP_VERSION`
- `package.json` : bump de `version` de `"0.0.0"` à `"0.1.0"` (premier jalón versionné)
- Tests : mise à jour de `importExport.test.ts` et `promptRepository.test.ts`
