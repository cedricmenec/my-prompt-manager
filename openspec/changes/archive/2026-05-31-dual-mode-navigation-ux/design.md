## Context

L'application est une SPA React (Vite + TypeScript + Tailwind) sans backend. L'état global est géré via `PromptsContext` (useReducer + useState). Le layout actuel est :

```
MainLayoutShell
├── SidebarNav  (logo + nav links + collections + footer)
└── main
    ├── TopAppBar  (masqué si PromptView actif)
    └── [PromptListView | PromptView]
        └── PromptListView rend GalleryView si appView === 'gallery'
```

Le mode switcher existe déjà dans le state (`appView: 'prompts' | 'gallery'`), mais il est exposé comme un simple lien dans la sidebar — sans identité visuelle forte. La `PromptView` masque toute la barre de contenu, y compris la recherche, ce qui est cohérent pour la navigation texte mais ne sera plus vrai avec le nouveau `GlobalTopBar`.

## Goals / Non-Goals

**Goals:**
- Exposer les deux modes de navigation (Prompts / Gallery) comme destinations de premier rang via un segmented control dans une `GlobalTopBar` permanente
- Rendre la `SidebarNav` mode-aware (contenu adapté selon le mode actif)
- Fournir une vue détail dédiée aux prompts image (`ImagePromptView`)
- Adapter la `TopAppBar` contextuelle selon le mode (discrète en galerie)
- Conserver `Settings` en bas à gauche de la sidebar

**Non-Goals:**
- Modifier le modèle de données `Prompt` (le champ `type` existe déjà)
- Ajouter des animations de transition entre modes
- Implémenter un mode plein-écran pour les images
- Modifier la `PromptView` standard (reste inchangée pour les prompts texte)

## Decisions

### D1 — GlobalTopBar séparé de la SidebarNav

**Choix** : Créer un nouveau composant `GlobalTopBar` au-dessus de la zone `SidebarNav + content`, pleine largeur.

**Pourquoi** : Le logo et le mode switcher doivent visuellement "surplomber" les deux zones (sidebar et contenu), ce qui est impossible si le logo reste dans la sidebar.

**Alternative considérée** : Déplacer le logo dans la sidebar en conservant sa largeur de 260px et aligner le switcher à droite — rejeté car le switcher serait visuellement éloigné du contenu et perdu dans la sidebar.

**Structure résultante** :
```
GlobalTopBar  (h-14, flex row, logo gauche, switcher centré ou droite-centre)
├── SidebarNav  (260px, sans logo)
└── main
    ├── TopAppBar  (contextuelle, visible sauf si appView=gallery + imageSelected)
    └── [PromptListView | GalleryView | ImagePromptView | PromptView]
```

### D2 — Suppression du prop `hideTopBar` dans MainLayoutShell

**Choix** : Le `GlobalTopBar` est toujours visible. La `TopAppBar` contextuelle reste masquée en `PromptView` (comportement actuel inchangé). En `ImagePromptView`, la `TopAppBar` est masquée aussi.

**Pourquoi** : L'utilisateur doit toujours voir dans quel mode il se trouve, même en vue détail. Seule la barre contextuelle (search + view toggle) est escamotée.

### D3 — Sidebar mode-aware via `appView`

**Choix** : La `SidebarNav` lit `appView` depuis le contexte et conditionne ses sections :
- Mode `prompts` : All Prompts, Favorites, Uncollected (badge), separator, Collections (tous tags)
- Mode `gallery` : All Images, Favorites, separator, Collections (tags filtrés aux prompts `type === 'image'`)

**Pourquoi** : En mode gallery, "Uncollected" n'a pas de sens visuel (les images sont navigées visuellement, pas par absence de tag). Les collections en gallery ne doivent montrer que les tags réellement présents sur des prompts image.

**Alternative considérée** : Une sidebar unifiée avec les mêmes items dans les deux modes — rejeté car confus (Uncollected en mode gallery n'apporte rien).

### D4 — Reset du filtre actif au passage en mode Gallery

**Choix** : Quand `appView` bascule de `prompts` vers `gallery`, `activeFilter` est réinitialisé à `{ type: 'all' }`.

**Pourquoi** : La galerie est un espace de découverte visuelle. Arriver en galerie avec un filtre "Uncollected" ou une recherche active cassera probablement l'expérience (vue vide). L'ouverture fraîche est préférable.

**Note** : La `searchQuery` est également remise à vide lors du changement de mode pour la même raison.

### D5 — `ImagePromptView` comme composant dédié (pas une variante de `PromptView`)

**Choix** : Nouveau composant `ImagePromptView` avec sa propre structure visuelle (image grande en haut, métadonnées en bas), indépendant de `PromptView`.

**Pourquoi** : `PromptView` est orientée texte (content en premier, image en annexe). Partager le composant via props conditionnels créerait du coupling et des ramifications `if type === 'image'` dans toute la vue. Deux composants distincts restent lisibles et évolutifs séparément.

**Scénario d'ouverture** :
- Clic sur une card en `GalleryView` → dispatch `SELECT` → `App.tsx` détecte `selectedPromptId` + `appView === 'gallery'` → rend `ImagePromptView`
- Clic sur une card en `PromptListView` → dispatch `SELECT` → `App.tsx` rend `PromptView` (inchangé)

### D6 — TopAppBar discrète en mode Gallery (pas escamotable)

**Choix** : En mode gallery, la `TopAppBar` conserve la search bar mais avec un style atténué (fond transparent, bordure légère) et sans le toggle Grid/List.

**Pourquoi** : Masquer complètement la search casse la possibilité de filtrer par titre/tag. Un pattern "icône loupe qui s'expand" ajoute une interaction pour un gain marginal. Le style discret est le bon équilibre.

**Implémentation** : `TopAppBar` reçoit `appView` depuis le contexte et applique conditionnellement les classes Tailwind.

### D7 — `+ New Prompt` en mode Gallery pré-sélectionne `type: 'image'`

**Choix** : Le CTA "+ New Image Prompt" en sidebar gallery dispatch `OPEN_CREATE` avec un payload `initialType: 'image'`.

**Pourquoi** : L'utilisateur en mode gallery veut créer un prompt image. Forcer le type évite une saisie manuelle.

**Implémentation** : `PromptsContext` expose `openCreate(type?: 'text' | 'image')` qui dispatch avec le type initial. `PromptEditor` lit `state.initialType` pour pré-sélectionner le champ type.

## Risks / Trade-offs

- **`hideTopBar` supprimé de `MainLayoutShell`** → La prop n'existe plus, la logique est déplacée dans `App.tsx` (conditionner le rendu de `TopAppBar` selon la vue, pas dans le shell). Risque faible, changement contenu.

- **Dérivation des collections galerie** → Les collections en mode gallery sont dérivées en filtrant `state.prompts` par `type === 'image'`. Si un tag n'est présent que sur des prompts texte, il disparaît de la sidebar en mode gallery. Comportement attendu et correct, mais à tester avec des données mixtes.

- **Reset du filtre au changement de mode** → Si l'utilisateur avait sélectionné une collection et veut basculer en gallery pour voir les images de cette même collection, le reset brise cette continuité. C'est un choix délibéré (D4) mais à documenter dans les specs.

- **`ImagePromptView` sans éditeur inline** → La vue image est en lecture seule dans ce change. L'édition passe par un bouton "Edit" qui ouvre l'éditeur standard. Acceptable pour V1.

## Migration Plan

Aucune migration de données requise. `Prompt.type` existe déjà dans le schéma avec default `'text'`. Les prompts existants sans `type` explicite restent en mode texte.

Déploiement direct — pas de feature flag nécessaire (changement purement UI, pas de breaking change sur les données).
