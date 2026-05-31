## 1. Configuration du projet

- [x] 1.1 Bumper `package.json` version `0.0.0` → `0.1.0`
- [x] 1.2 Ajouter `define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version ?? '0.0.0') }` dans `vite.config.ts`
- [x] 1.3 Ajouter la déclaration TypeScript pour `import.meta.env.VITE_APP_VERSION` dans `vite-env.d.ts` ou `env.d.ts`

## 2. Infrastructure DB — structure IDB

- [x] 2.1 Bumper `DB_VERSION` de `2` à `3` dans `src/infrastructure/db.ts`
- [x] 2.2 Ajouter l'interface `_meta` dans le type `PromptDB` (`key: string`, `value: string | number`)
- [x] 2.3 Ajouter le store `_meta` dans le callback `upgrade` (cas `oldVersion < 3`) sans toucher au store `prompts`
- [x] 2.4 Exposer la fonction `initDb(): Promise<IDBPDatabase<PromptDB>>` qui orchestre `openDB()` + `runDataMigrations()` + écriture de `appVersion` dans `_meta`

## 3. Data migration runner

- [x] 3.1 Créer `src/infrastructure/dataMigrations.ts` avec le type `DataMigration`, la constante `DATA_SCHEMA_VERSION = 1`, et le tableau `dataMigrations: DataMigration[]` (vide pour l'instant)
- [x] 3.2 Implémenter `runDataMigrations(db)` : lecture de `_meta.schemaVersion`, filtrage + exécution des migrations manquantes dans l'ordre, écriture de `_meta.schemaVersion = DATA_SCHEMA_VERSION`
- [x] 3.3 Écrire les tests unitaires de `runDataMigrations` : aucune migration en attente, migrations appliquées dans l'ordre, DB neuve initialise `schemaVersion`

## 4. Import/Export — versioning de l'enveloppe

- [x] 4.1 Mettre à jour l'interface `ExportEnvelope` dans `importExport.ts` : remplacer `schema: string` par `appVersion: string` et `schemaVersion: number`
- [x] 4.2 Mettre à jour `exportPromptsToJson` pour utiliser `import.meta.env.VITE_APP_VERSION` et `DATA_SCHEMA_VERSION`
- [x] 4.3 Ajouter le registry `importTransformers: Record<number, (prompts: unknown[]) => unknown[]>` et la fonction `migrateImportedPrompts(prompts, fromVersion, toVersion)` dans `importExport.ts`
- [x] 4.4 Mettre à jour `ImportParseResult` pour ajouter `migrationWarning?: string`
- [x] 4.5 Mettre à jour `parseImportFile` : détecter `schemaVersion` (avec fallback `schema: "v1"` → version 1), rejeter si fichier trop récent, migrer à la volée si fichier plus ancien, définir `migrationWarning`

## 5. Point d'entrée de l'application

- [x] 5.1 Remplacer l'appel à `getDb()` par `initDb()` au démarrage dans `src/app/App.tsx` (ou le hook/contexte approprié dans `PromptsContext.tsx`)

## 6. Tests

- [x] 6.1 Mettre à jour `src/infrastructure/importExport.test.ts` : tester les nouveaux champs de l'enveloppe, le warning de migration, le rejet si schemaVersion > courant, la compatibilité `schema: "v1"`
- [x] 6.2 Mettre à jour `src/infrastructure/promptRepository.test.ts` : vérifier que `DB_VERSION` est bien `3` et que le store `_meta` existe après initialisation
- [x] 6.3 Vérifier que `pnpm test` passe sans erreur
