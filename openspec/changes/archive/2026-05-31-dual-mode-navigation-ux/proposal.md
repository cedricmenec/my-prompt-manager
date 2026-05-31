## Why

L'application gère deux catégories de prompts fondamentalement différentes — les prompts générant des **images** et les prompts **textuels / agents** — mais les expose actuellement au sein du même paradigme de navigation. La galerie d'images existe déjà, mais elle est reléguée en lien secondaire dans la sidebar, sans identité propre. L'UX ne reflète pas la différence de mode de consultation : une galerie visuelle masonry pour les images, une liste/grille filtrée par recherche et tags pour les prompts textuels.

## What Changes

- Nouveau composant `GlobalTopBar` : barre pleine largeur toujours visible, contenant le logo + un segmented control **Prompts | Gallery** pour basculer entre les deux modes de navigation
- Le logo est retiré de la `SidebarNav` (déplacé dans le `GlobalTopBar`)
- La `SidebarNav` devient **mode-aware** :
  - Mode Prompts : All Prompts, Favorites, Uncollected (badge), Collections (tous tags)
  - Mode Gallery : All Images, Favorites, Collections (uniquement les tags présents sur des prompts `type: 'image'`)
- Le bouton **+ New Prompt** en mode Gallery pré-sélectionne `type: 'image'` dans l'éditeur
- Basculer vers le mode Gallery **réinitialise le filtre actif** à `all` (découverte visuelle fraîche)
- La `TopAppBar` (barre contextuelle de contenu) s'adapte au mode :
  - Mode Prompts : barre de recherche pleine largeur + toggle Grid/List
  - Mode Gallery : barre de recherche discrète (fond transparent, bordure atténuée), sans toggle de vue
- Nouveau composant `ImagePromptView` : vue détail dédiée aux prompts image — image grande (≈60vh) au-dessus, contenu texte du prompt en dessous
- Un clic sur une image dans la GalleryView ouvre la `ImagePromptView` au lieu de la `PromptView` standard
- Le `MainLayoutShell` est restructuré pour que le `GlobalTopBar` soit toujours visible, y compris en vue détail prompt

## Capabilities

### New Capabilities

- `global-top-bar` : Barre de navigation globale (logo + mode switcher segmented control Prompts/Gallery), toujours visible, pleine largeur au-dessus du layout sidebar+content
- `image-prompt-view` : Vue détail dédiée aux prompts image — affichage grande image, prompt content, metadata (titre, tags, favoris, notes, modèle)

### Modified Capabilities

- `main-layout-shell` : La structure du layout évolue — GlobalTopBar s'ajoute au-dessus de la zone sidebar+content ; le `hideTopBar` prop est supprimé (GlobalTopBar est toujours affiché)
- `sidebar-navigation` : La sidebar devient mode-aware (items différents selon Prompts/Gallery) ; le logo/brand est retiré ; les collections en mode Gallery sont filtrées aux prompts `type: 'image'` uniquement
- `top-app-bar` : Devient context-aware — style discret et sans toggle en mode Gallery ; comportement identique à aujourd'hui en mode Prompts
- `image-gallery-view` : Le clic sur une image déclenche l'ouverture de `ImagePromptView` (et non `PromptView`) ; le filtrage de la population de prompts (`type === 'image'`) est géré par le contexte en amont

## Impact

- **Nouveaux fichiers** : `src/features/layout/GlobalTopBar.tsx`, `src/features/prompts/ImagePromptView.tsx`
- **Fichiers modifiés** : `MainLayoutShell.tsx`, `SidebarNav.tsx`, `TopAppBar.tsx`, `GalleryView.tsx`, `PromptsContext.tsx`, `App.tsx`, `PromptEditor.tsx` (accepter un type initial)
- **Aucune dépendance externe** ajoutée
- **Aucun changement breaking** sur le modèle de données (`Prompt.type` existe déjà)
- `localStorage` : la persistance de `appView` existante couvre le mode switcher
