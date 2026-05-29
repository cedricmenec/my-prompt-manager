## Why

Les données utilisateur (prompts) sont stockées exclusivement dans IndexedDB du navigateur courant, sans aucun moyen de les sauvegarder ou de les transférer vers un autre navigateur. L'ajout d'un export/import JSON manuel permet à l'utilisateur de sauvegarder sa bibliothèque et de la restaurer sans dépendance à un service externe.

## What Changes

- Nouveau module `importExport.ts` dans la couche infrastructure : sérialisation JSON et validation Zod par prompt
- Ajout de `promptRepository.deleteAll()` pour la suppression en masse avant import
- Nouveau composant `SettingsPanel.tsx` (modal, accessible depuis la sidebar) structuré pour accueillir de futures sections (sync, API keys, auto-backup)
- Bouton ⚙ en footer de `SidebarNav` ouvrant le panneau Settings
- Export : génère et télécharge un fichier `byo-prompts-YYYY-MM-DD.json`
- Import : sélection de fichier JSON → validation partielle (prompts valides importés, invalides ignorés avec rapport) → modal de confirmation d'overwrite → `deleteAll()` + `bulkImport()`
- Fichier `deferred-features.md` à la racine notant les fonctionnalités différées (merge à l'import, auto-backup, sync Drive)

## Capabilities

### New Capabilities
- `import-export`: Sérialisation/désérialisation JSON de la bibliothèque de prompts avec validation Zod par entrée et import partiel
- `settings-panel`: Modal Settings accessible depuis la sidebar, structuré pour accueillir de futures sections (sync, API keys, auto-backup)

### Modified Capabilities
- `prompt-repository`: Ajout de la méthode `deleteAll()` — suppression en masse de tous les prompts stockés

## Impact

- `src/infrastructure/promptRepository.ts` : ajout de `deleteAll()`
- `src/infrastructure/importExport.ts` : nouveau fichier (export JSON, parse/validate import)
- `src/features/settings/SettingsPanel.tsx` : nouveau composant
- `src/features/layout/SidebarNav.tsx` : bouton ⚙ Settings en footer
- `src/features/prompts/PromptsContext.tsx` : exposition de `importPrompts` et rechargement de l'état après import
- Aucune nouvelle dépendance npm (JSON natif, pas de jszip)
- `deferred-features.md` à la racine du projet
