# DB Schema Versioning

## Purpose

Fournit un mécanisme de traçabilité de la version courante du schéma de données et de la version de l'application, stockés dans IndexedDB. Permet à l'application de savoir si des migrations de données sont nécessaires au démarrage.

## ADDED Requirements

### Requirement: Store _meta dans IndexedDB
Le système SHALL créer un object store nommé `_meta` dans la base IndexedDB `byo-prompt-manager` lors du bump de `DB_VERSION` à `3`. Ce store utilise `key` comme keyPath et stocke des entrées `{ key: string, value: string | number }`.

#### Scenario: Premier chargement crée le store _meta
- **WHEN** l'application est ouverte pour la première fois (DB_VERSION < 3)
- **THEN** le store `_meta` est créé sans erreur dans le callback `upgrade`

---

### Requirement: Constante DATA_SCHEMA_VERSION
Le système SHALL exporter une constante `DATA_SCHEMA_VERSION: number` depuis `src/infrastructure/dataMigrations.ts` représentant la version courante du schéma de données. Cette valeur est incrémentée à chaque ajout de migration de données.

#### Scenario: DATA_SCHEMA_VERSION est accessible à l'import
- **WHEN** `DATA_SCHEMA_VERSION` est importée depuis `dataMigrations.ts`
- **THEN** elle vaut un entier >= 1

---

### Requirement: Fonction initDb()
Le système SHALL exporter une fonction `initDb(): Promise<IDBPDatabase<PromptDB>>` depuis `src/infrastructure/db.ts` qui :
- Appelle `openDB()` (déclenchant le callback `upgrade` si nécessaire)
- Appelle `runDataMigrations(db)` après l'ouverture
- Écrit `appVersion` dans `_meta` avec la valeur de `import.meta.env.VITE_APP_VERSION`
- Retourne la DB initialisée

#### Scenario: initDb complète sans erreur sur une DB neuve
- **WHEN** `initDb()` est appelée sans DB existante
- **THEN** la DB est créée, les migrations s'exécutent, et la promesse résout avec la DB

#### Scenario: initDb écrit appVersion dans _meta
- **WHEN** `initDb()` est appelée
- **THEN** `_meta` contient une entrée `{ key: 'appVersion', value: <semver> }`

---

### Requirement: Injection de VITE_APP_VERSION
Le système SHALL définir `import.meta.env.VITE_APP_VERSION` dans `vite.config.ts` via le champ `define`, avec la valeur de `process.env.npm_package_version ?? '0.0.0'`.

#### Scenario: VITE_APP_VERSION est défini au build
- **WHEN** l'application est buildée avec pnpm/npm
- **THEN** `import.meta.env.VITE_APP_VERSION` retourne la version du `package.json`
