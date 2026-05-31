# Data Migration Runner

## Purpose

Fournit le registry des migrations de données et le runner qui les applique séquentiellement au démarrage, en comparant le `schemaVersion` courant stocké dans `_meta` avec `DATA_SCHEMA_VERSION`.

## ADDED Requirements

### Requirement: Type DataMigration et registry dataMigrations
Le système SHALL définir dans `src/infrastructure/dataMigrations.ts` :
- Un type `DataMigration = { version: number; description: string; migrate: (db: IDBPDatabase<PromptDB>) => Promise<void> }`
- Un tableau exporté `dataMigrations: DataMigration[]` contenant toutes les migrations de données enregistrées, triées par `version` croissante
- Les migrations doivent être idempotentes

#### Scenario: Registry vide au lancement initial
- **WHEN** `dataMigrations` est importé
- **THEN** il s'agit d'un tableau (éventuellement vide) sans erreur à l'import

---

### Requirement: Fonction runDataMigrations()
Le système SHALL exporter une fonction `runDataMigrations(db: IDBPDatabase<PromptDB>): Promise<void>` qui :
- Lit `_meta.schemaVersion` (ou considère `0` si absent)
- Filtre `dataMigrations` pour ne garder que celles dont `version > currentSchemaVersion`
- Les exécute dans l'ordre croissant de `version`
- Après toutes les migrations, écrit `{ key: 'schemaVersion', value: DATA_SCHEMA_VERSION }` dans `_meta`
- Ne fait rien si aucune migration n'est en attente

#### Scenario: Aucune migration en attente — _meta.schemaVersion inchangé
- **WHEN** `runDataMigrations()` est appelé et `_meta.schemaVersion` vaut déjà `DATA_SCHEMA_VERSION`
- **THEN** aucune migration n'est exécutée et `_meta.schemaVersion` reste identique

#### Scenario: Migrations manquantes sont appliquées dans l'ordre
- **WHEN** `_meta.schemaVersion` vaut `N` et que deux migrations (version N+1, version N+2) existent dans le registry
- **THEN** elles sont exécutées dans cet ordre et `_meta.schemaVersion` passe à `N+2`

#### Scenario: runDataMigrations sur DB neuve initialise schemaVersion
- **WHEN** `runDataMigrations()` est appelé et `_meta` ne contient pas de `schemaVersion`
- **THEN** `_meta.schemaVersion` est écrit avec la valeur de `DATA_SCHEMA_VERSION`
