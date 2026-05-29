## 1. Infrastructure — Repository

- [x] 1.1 Ajouter `promptRepository.deleteAll(): Promise<void>` dans `src/infrastructure/promptRepository.ts` (utilise `db.clear('prompts')`)
- [x] 1.2 Ajouter un test unitaire pour `deleteAll` dans `src/infrastructure/promptRepository.test.ts` (store non vide → vide ; store vide → no-op)

## 2. Infrastructure — Import/Export

- [x] 2.1 Créer `src/infrastructure/importExport.ts` avec le type `ImportFormatError` (subclass d'`Error`)
- [x] 2.2 Implémenter `exportPromptsToJson(prompts: Prompt[]): void` — construit l'enveloppe `{ exportedAt, schema: "v1", promptCount, prompts }` et déclenche le téléchargement via un lien `<a>` temporaire
- [x] 2.3 Implémenter `parseImportFile(file: File): Promise<ImportParseResult>` — lit le fichier, parse le JSON, vérifie `schema === "v1"`, valide chaque prompt avec `PromptSchema.safeParse`, retourne `{ valid, errors }`
- [x] 2.4 Exporter les types `ImportParseResult` et `ImportValidationError` depuis `importExport.ts`
- [x] 2.5 Créer `src/infrastructure/importExport.test.ts` avec des tests unitaires pour les 4 scénarios de `parseImportFile` (all valid, partial, malformed JSON, unknown schema)

## 3. Feature — Settings Panel

- [x] 3.1 Créer `src/features/settings/SettingsPanel.tsx` — modal avec backdrop, fermeture sur Escape et clic backdrop
- [x] 3.2 Implémenter la section "Data" avec les boutons "Export JSON" et "Import JSON" (input file caché déclenché programmatiquement)
- [x] 3.3 Implémenter les sections placeholder "Sync", "API Keys", "Auto-backup" avec label "coming soon"
- [x] 3.4 Câbler le bouton "Export JSON" : appel `exportPromptsToJson(state.prompts)` via `usePrompts()`
- [x] 3.5 Câbler le bouton "Import JSON" : déclenche l'input file, appelle `parseImportFile`, gère `ImportFormatError` avec un Toast d'erreur, affiche la modal de confirmation si succès
- [x] 3.6 Implémenter la modal de confirmation d'import : affiche le nombre de prompts courants à remplacer, le nombre de prompts valides à importer, et la liste des erreurs si `errors.length > 0`
- [x] 3.7 Implémenter l'action confirmée : `promptRepository.deleteAll()` → `promptRepository.bulkImport(valid)` → `promptRepository.getAll()` → dispatch `LOAD` → Toast de succès
- [x] 3.8 Implémenter l'action annulée : fermer la modal sans modifier les données

## 4. Feature — Sidebar Settings button

- [x] 4.1 Ajouter l'état `settingsPanelOpen` (booléen local) dans `SidebarNav.tsx`
- [x] 4.2 Ajouter un bouton ⚙ Settings en footer de `SidebarNav` qui passe `settingsPanelOpen` à `true`
- [x] 4.3 Rendre `<SettingsPanel>` conditionellement depuis `SidebarNav` quand `settingsPanelOpen` est `true`

## 5. Deferred Features Note

- [x] 5.1 Créer `deferred-features.md` à la racine du projet, listant : merge à l'import, auto-backup périodique, synchronisation Google Drive

## 6. Validation finale

- [x] 6.1 Vérifier que `pnpm build` passe sans erreur TypeScript
- [x] 6.2 Vérifier que `pnpm test` passe (tous les nouveaux et anciens tests)
- [x] 6.3 Tester manuellement le flux export → import dans le navigateur (même navigateur et navigateur différent)
- [x] 6.4 Tester le cas d'import avec un fichier JSON invalide (vérifier le Toast d'erreur)
- [x] 6.5 Tester l'import partiel (fichier avec prompts invalides, vérifier le rapport dans la modal)
