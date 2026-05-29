## Context

Les prompts sont stockés dans IndexedDB via `promptRepository`. Il n'existe actuellement aucun mécanisme pour sauvegarder ou transférer cette base de données. Les composants de mise en page existants (`SidebarNav`, `TopAppBar`) ne contiennent pas de point d'entrée vers des fonctionnalités de configuration. L'application n'a pas de panneau Settings.

## Goals / Non-Goals

**Goals:**
- Export de toute la bibliothèque de prompts dans un fichier JSON téléchargeable
- Import depuis un fichier JSON avec validation par prompt et import partiel (les invalides sont ignorés, rapport affiché)
- Overwrite systématique à l'import (confirmation obligatoire)
- Panneau Settings modal extensible prêt à accueillir les futures fonctionnalités (sync Drive, API keys, auto-backup)
- Aucune nouvelle dépendance npm

**Non-Goals:**
- Import par merge / fusion avec les données existantes (différé)
- Auto-backup périodique (différé)
- Synchronisation Drive (différé)
- Export au format ZIP ou Markdown (différé)

## Decisions

### Format d'export : JSON natif (pas de jszip)
Un seul fichier JSON avec une enveloppe normalisée :
```json
{
  "exportedAt": "2026-05-29T14:30:00.000Z",
  "schema": "v1",
  "promptCount": 42,
  "prompts": [...]
}
```
**Raison** : Zéro dépendance ajoutée, lisible directement, suffisant pour les prompts seuls. Le champ `schema` permet la migration de format future. jszip sera évalué si on ajoute settings, assets ou d'autres stores.

### Module `importExport.ts` dans la couche infrastructure
Responsabilités isolées : sérialisation, déclenchement du téléchargement, parsing, validation. Pas de logique React dedans.
**Raison** : Testable sans DOM, cohérent avec le pattern `promptRepository` et `markdownParser`. Le module sera réutilisable par d'autres consumers (Drive sync, CLI éventuel).

### Validation partielle à l'import (import partiel + rapport)
`parseImportFile` retourne `{ valid: Prompt[], errors: ImportValidationError[] }`. Les prompts invalides sont ignorés ; l'UI affiche le nombre dans la modal de confirmation.
**Raison** : L'utilisateur peut avoir légèrement modifié son fichier manuellement. Un fail-fast serait frustrant pour 1 prompt sur 100. Le rapport dans la modal maintient la transparence.

### Stratégie d'import : overwrite uniquement
`deleteAll()` + `bulkImport(valid)` dans la confirmation.
**Raison** : Simple à implémenter et à comprendre. La stratégie de merge sera ajoutée quand le Drive sync sera développé (le même problème s'y posera). Note dans `deferred-features.md`.

### UI : panneau Settings en modal depuis la sidebar
Un bouton ⚙ en footer de `SidebarNav` ouvre `SettingsPanel` (modal plein écran avec backdrop). Le panneau est structuré en sections : "Data" (actif), "Sync" / "API Keys" / "Auto-backup" (placeholders visibles, marqués "coming soon").
**Raison** : La sidebar est le point d'entrée naturel pour les actions globales. La structure en sections prépare l'extensibilité sans sur-ingénierie. Alternative envisagée : bouton ⚙ dans la TopAppBar — rejeté car la TopAppBar est déjà occupée par la recherche et les contrôles de vue.

### `deleteAll()` dans `promptRepository`
Nouvelle méthode qui vide le store en une transaction IDB avec `clear()`.
**Raison** : Opération atomique, cohérente avec le pattern du repository existant. Utilisée uniquement à l'import pour l'instant ; utile aussi pour les tests et les futurs "reset factory".

### Rechargement d'état après import via `promptRepository.getAll()`
Après `bulkImport`, on rappelle `getAll()` et on dispatch `LOAD` dans `PromptsContext`.
**Raison** : Cohérent avec le chargement initial ; évite de maintenir deux sources de vérité. Pas de refacto du reducer nécessaire.

## Risks / Trade-offs

- **Perte de données si le fichier d'import est corrompu partiellement** → L'utilisateur est averti par la liste des erreurs dans la modal avant de confirmer. La confirmation est irréversible : bien insister dans le wording.
- **Fichiers très volumineux (milliers de prompts)** → `FileReader` et `JSON.parse` sont synchrones côté parsing. Acceptable pour une bibliothèque personnelle (centaines de prompts max). À surveiller si on ouvre à des imports massifs.
- **Compatibilité future du format** → Le champ `schema: "v1"` permet de rejeter ou migrer les fichiers d'anciennes/futures versions. Prévoir une validation stricte sur ce champ à l'import.
- **Import sur mobile** → `<input type="file">` déclenché programmatiquement peut être bloqué sur certains mobiles si non dans un handler d'événement utilisateur direct. Le bouton "Import JSON" doit être le déclencheur direct (pas un setTimeout).

## Migration Plan

Aucune migration de données IndexedDB requise. La nouvelle méthode `deleteAll()` est additive. Le panneau Settings est un nouveau composant indépendant. Déploiement sans breaking change.
