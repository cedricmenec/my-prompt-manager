## Context

L'application utilise IndexedDB via la librairie `idb` (fichier `src/infrastructure/db.ts`). Le mécanisme natif `openDB(..., version, { upgrade })` gère les migrations **structurelles** (création de stores, d'indexes). Il ne gère pas les migrations de **données** (transformer des records existants).

L'état actuel :
- `DB_VERSION = 2` — deux migrations structurelles déjà présentes
- Aucune traçabilité de la version courante dans la DB elle-même
- `importExport.ts` encode `schema: "v1"` en dur, sans logique de version à l'import
- `package.json` est à `version: "0.0.0"`, jamais injecté dans le bundle

## Goals / Non-Goals

**Goals:**
- Tracer `schemaVersion` (entier, migrations de données) et `appVersion` (semver) dans un store `_meta` IndexedDB
- Exécuter automatiquement les migrations de données manquantes au premier chargement après une mise à jour
- Enrichir l'enveloppe export avec `schemaVersion` et `appVersion`
- Détecter la version à l'import et migrer à la volée si nécessaire, avec warning non bloquant

**Non-Goals:**
- Migrations structurelles IDB (stores, indexes) — reste dans le callback `upgrade` natif
- Migrations lourdes (itérer sur des dizaines de milliers de records en transaction bloquante)
- Rollback automatique de migrations
- Synchronisation multi-onglets lors d'une migration

## Decisions

### Décision 1 — Deux compteurs orthogonaux

**Choix** : `DB_VERSION` (IDB natif, structure) reste indépendant de `DATA_SCHEMA_VERSION` (entier en code, données).

**Rationale** : Un ajout d'index IDB ne requiert pas de transformation de données et vice-versa. Coupler les deux forcerait un bump `DB_VERSION` à chaque migration de données, ce qui est sémantiquement incorrect et crée une transaction bloquante inutile.

**Alternative rejetée** : Tout mettre dans le callback `upgrade` — impossible à tester unitairement, risque de freeze UI sur migrations de données volumineuses, transaction bloquante.

---

### Décision 2 — Store `_meta` pour la traçabilité, pas de table `_migrations`

**Choix** : Un seul store `_meta` avec des entrées clé/valeur (`schemaVersion`, `appVersion`). Pas de log des migrations appliquées.

**Rationale** : Pour des migrations légères et séquentielles, un entier `schemaVersion` est suffisant. Les migrations appliquées = toutes celles dont `version <= schemaVersion`. Un log d'IDs est du sur-engineering pour ce cas d'usage.

**Alternative rejetée** : Store `_migrations` avec un enregistrement par migration — overhead pour ce scope, complexité inutile.

---

### Décision 3 — `runDataMigrations()` appelé après `openDB()`, pas dans `upgrade`

**Choix** : La fonction `initDb()` orchestre d'abord `openDB()` (qui déclenche le callback `upgrade` natif si nécessaire), puis appelle `runDataMigrations(db)`.

```
initDb()
  └─ openDB()         // structure IDB — synchrone dans la transaction upgrade
       └─ runDataMigrations(db)   // données — async, hors transaction bloquante
            └─ lit _meta.schemaVersion
            └─ applique migrations manquantes en ordre
            └─ écrit _meta.schemaVersion = DATA_SCHEMA_VERSION
            └─ écrit _meta.appVersion = __APP_VERSION__
```

**Rationale** : Les migrations de données peuvent être async, longues, et s'exécuter en dehors de la transaction `upgrade` bloquante.

---

### Décision 4 — Injection de `appVersion` via `import.meta.env.VITE_APP_VERSION`

**Choix** : Dans `vite.config.ts`, ajouter :
```ts
define: {
  'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
}
```

**Rationale** : C'est le pattern standard Vite. `npm_package_version` est automatiquement disponible dans l'environnement npm/pnpm. Pas de dépendance externe.

**Alternative rejetée** : `__APP_VERSION__` comme convention custom — moins standard, nécessite une déclaration TypeScript supplémentaire.

---

### Décision 5 — Import : warning non bloquant + migration à la volée + skip des invalides

**Choix** :
- Si `schemaVersion` fichier < app → appliquer les transformateurs en chaîne, puis valider avec `PromptSchema.safeParse()`. Retourner un `ImportParseResult` enrichi avec un champ `migrationWarning: string | undefined`.
- Si `schemaVersion` fichier > app → rejet immédiat avec `ImportFormatError`.
- Si certains prompts sont invalides après migration → skip + accumuler dans `errors` (comportement actuel).
- Fichiers sans `schemaVersion` (anciens exports avec `schema: "v1"`) → traités comme `schemaVersion: 1`.

**Rationale** : L'utilisateur ne doit pas être bloqué par une version légèrement ancienne. Le warning visible dans l'UI lui donne l'information sans friction.

---

### Décision 6 — Compatibilité descendante : `schema: "v1"` dans les anciens exports

**Choix** : À l'import, si le champ `schema` vaut `"v1"` et que `schemaVersion` est absent, on considère le fichier comme `schemaVersion: 1`. Si `schema` est absent et `schemaVersion` est absent → `ImportFormatError`.

**Rationale** : Des fichiers exportés avec l'ancienne version de l'app existent potentiellement. Les rejeter serait une mauvaise expérience utilisateur.

## Risks / Trade-offs

- **[Risque] Migration partielle** : Si `runDataMigrations()` plante à mi-chemin, `schemaVersion` n'est pas mis à jour et la migration sera rejouée au prochain démarrage. → Mitigation : chaque migration est idempotente (vérification `if (!field)` avant écriture).
- **[Risque] `npm_package_version` absent en CI** : → Mitigation : fallback `process.env.npm_package_version ?? '0.0.0'` dans `vite.config.ts`.
- **[Trade-off] Deux stores à maintenir** : `_meta` s'ajoute à `prompts`. Complexité minimale, justifiée par le gain de traçabilité.
- **[Risque] Multi-onglets** : Si l'utilisateur ouvre deux onglets simultanément lors d'un upgrade IDB, l'onglet ancien reçoit un événement `versionchange`. → Hors scope pour l'instant (comportement navigateur natif suffit).

## Migration Plan

1. Bump `package.json` version `0.0.0` → `0.1.0`
2. Bump `DB_VERSION` `2` → `3` et ajouter le store `_meta` dans le callback `upgrade`
3. Créer `src/infrastructure/dataMigrations.ts` avec `DATA_SCHEMA_VERSION = 1`, registry vide, `runDataMigrations()`
4. Modifier `src/infrastructure/db.ts` : exposer `initDb()` qui orchestre `openDB()` + `runDataMigrations()`
5. Modifier `src/app/App.tsx` (ou point d'entrée) pour appeler `initDb()` au démarrage
6. Modifier `vite.config.ts` : ajouter `define` pour `VITE_APP_VERSION`
7. Modifier `src/infrastructure/importExport.ts` : nouvelle enveloppe, logique de version
8. Mettre à jour les tests

**Rollback** : Pas de rollback automatique. En cas de régression critique, l'utilisateur peut exporter ses données (export toujours fonctionnel), vider la DB via les DevTools, et réimporter.

## Open Questions

- Aucune — tous les points clés ont été tranchés en phase d'exploration.
