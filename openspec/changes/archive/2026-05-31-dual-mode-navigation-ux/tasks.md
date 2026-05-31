## 1. PromptsContext — State & Actions

- [x] 1.1 Ajouter `initialType?: 'text' | 'image'` au state (pour `OPEN_CREATE` avec type pré-sélectionné)
- [x] 1.2 Modifier l'action `OPEN_CREATE` pour accepter un payload `{ initialType?: 'text' | 'image' }` et stocker `initialType` dans le state
- [x] 1.3 Au dispatch de `setAppView('gallery')` : réinitialiser `activeFilter` à `{ type: 'all' }` et vider `searchQuery`
- [x] 1.4 Vérifier que `filteredPrompts` en mode gallery ne pre-filtre pas par type (c'est `GalleryView` qui filtre) — aucun changement si c'est déjà le cas

## 2. GlobalTopBar — Nouveau composant

- [x] 2.1 Créer `src/features/layout/GlobalTopBar.tsx`
- [x] 2.2 Afficher le logo SVG et le nom "Prompt Vault" à gauche
- [x] 2.3 Afficher le segmented control (deux segments : "Prompts" et "Gallery") au centre ou à droite
- [x] 2.4 Appliquer le style actif/inactif selon `appView` depuis `usePrompts()`
- [x] 2.5 Au clic sur "Gallery" : appeler `setAppView('gallery')` (le reset du filtre est géré par le contexte, tâche 1.3)
- [x] 2.6 Au clic sur "Prompts" : appeler `setAppView('prompts')`

## 3. MainLayoutShell — Restructuration

- [x] 3.1 Ajouter `<GlobalTopBar />` au-dessus de la zone `SidebarNav + main` dans `MainLayoutShell`
- [x] 3.2 Ajuster la hauteur de la zone inférieure (`h-screen` → `h-[calc(100vh-3.5rem)]` ou utiliser `flex-1` avec overflow) pour compenser la hauteur du `GlobalTopBar`
- [x] 3.3 Supprimer le prop `hideTopBar` de `MainLayoutShell` et de `App.tsx`

## 4. SidebarNav — Mode-aware

- [x] 4.1 Supprimer le bloc brand header (logo + "Prompt Vault") de `SidebarNav`
- [x] 4.2 Supprimer le bouton "Gallery" et son séparateur des liens de navigation primaires
- [x] 4.3 Conditionner le CTA : afficher "+ New Prompt" (dispatch `OPEN_CREATE` sans type) en mode `prompts`, afficher "+ New Image Prompt" (dispatch `OPEN_CREATE` avec `initialType: 'image'`) en mode `gallery`
- [x] 4.4 En mode `prompts` : afficher All Prompts, Favorites, Uncollected (avec badge), Collections dérivées de tous les tags
- [x] 4.5 En mode `gallery` : afficher "All Images", Favorites, Collections dérivées uniquement des prompts `type === 'image'`
- [x] 4.6 Masquer "Uncollected" en mode `gallery`

## 5. TopAppBar — Context-aware

- [x] 5.1 Lire `appView` depuis `usePrompts()`
- [x] 5.2 En mode `gallery` : appliquer un style discret sur l'input search (fond transparent, bordure atténuée, placeholder adapté)
- [x] 5.3 En mode `gallery` : masquer le bloc view toggle (grid/list)
- [x] 5.4 En mode `prompts` : conserver le comportement et le style actuels (aucun changement)

## 6. App.tsx — Routing vers ImagePromptView

- [x] 6.1 Importer `ImagePromptView`
- [x] 6.2 Modifier la condition de rendu : si `selectedPromptId !== null && appView === 'gallery'` → rendre `<ImagePromptView />`, sinon si `selectedPromptId !== null || viewMode === 'edit'` → rendre `<PromptView />`, sinon → rendre `<PromptListView />`
- [x] 6.3 Supprimer le prop `hideTopBar` passé à `MainLayoutShell`

## 7. ImagePromptView — Nouveau composant

- [x] 7.1 Créer `src/features/prompts/ImagePromptView.tsx`
- [x] 7.2 Afficher un bouton "← Back to Gallery" qui dispatch `DESELECT`
- [x] 7.3 Afficher un bouton "Edit" qui dispatch `OPEN_EDIT`
- [x] 7.4 Afficher l'image `imageUrl` en grand (max-h ~60vh, object-contain) ; afficher un placeholder si pas d'`imageUrl`
- [x] 7.5 Afficher en dessous : titre, tags (badges), isFavorite (icône étoile), content du prompt, description (si présente), model (si présent), notes (si présentes)

## 8. GalleryView — Mise à jour du click handler

- [x] 8.1 Modifier le handler `onClick` de `GalleryCard` pour dispatcher `{ type: 'SELECT', id: prompt.id }` (comportement existant — vérifier qu'il n'appelle pas `PromptView` directement)
- [x] 8.2 S'assurer que `GalleryView` ne rend plus `PromptView` inline — la navigation est gérée par `App.tsx`

## 9. PromptEditor — Type initial

- [x] 9.1 Lire `state.initialType` depuis `PromptsContext` dans `PromptEditor`
- [x] 9.2 Initialiser le champ `type` du formulaire avec `state.initialType ?? 'text'` à l'ouverture
- [x] 9.3 Réinitialiser `initialType` à `undefined` dans le state lors du dispatch `CLOSE_EDITOR`

## 10. Vérification & nettoyage

- [x] 10.1 Vérifier que `pnpm build` passe sans erreurs TypeScript
- [x] 10.2 Vérifier que `pnpm test` passe (29 tests existants)
- [x] 10.3 Tester manuellement la bascule Prompts ↔ Gallery et la réinitialisation du filtre
- [x] 10.4 Tester la création d'un prompt image depuis le mode Gallery (type pré-sélectionné)
- [x] 10.5 Tester l'ouverture de `ImagePromptView` depuis la galerie et le retour galerie
