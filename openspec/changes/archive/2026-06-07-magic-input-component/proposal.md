## Why

Le feature `prompt-input-ai-assistant` (génération de titre et description via IA) requiert des contrôles magic-wand sur les champs `Title` et `Description` dans l'éditeur de prompt. Actuellement, ces contrôles sont intégrés directement dans le composant PromptView. Extraire un composant réutilisable `MagicInput` permet de :
- Centraliser le comportement common (icône intégrée, état de chargement, animation) dans un seul composant
- Faciliter l'ajout futur de champes IA-générables sans dupliquer le code UI
- Suivre le pattern existant de composants partagés (`Button`, `Modal`, `Toast` dans `src/shared/ui/`)

## What Changes

- **Nouveau composant réutilisable `MagicInput`** dans `src/shared/ui/MagicInput.tsx` :
  - Supporte `<input>` (single-line) et `<textarea>` (multi-line)
  - Icône baguette magique positionnée à l'intérieur du champ, à droite
  - État de chargement : pulsation subtile + changement de couleur + désactivation du clic
  - Props de callback `onMagicAction` déclenché au clic sur l'icône
  - Props `isGenerating` pour contrôler l'état de chargement
  - Props `variant: 'single' | 'multi'` pour choisir input vs textarea
  - Toutes les props native input/textarea sont transmises (pass-through)
  - Support dark/light mode via le système de variables CSS existant
  - Accessibilité : `aria-label` sur le bouton icône, focus visible
- **Mise à jour de `prompt-view` spec** : remplacer les "small icon-style magic-wand generation controls" par une référence au composant `MagicInput`
- **Intégration dans PromptView edit mode** : les champs `Title` et `Description` utilisent `MagicInput` au lieu d'un input/textarea brut + bouton séparé

## Capabilities

### New Capabilities
- `magic-input`: Composant réutilisable combinant un champ de saisie (input ou textarea) avec une icône baguette magique intégrée pour déclencher une action d'assistance IA. Gère l'état de chargement, l'animation, et la désactivation pendant la génération.

### Modified Capabilities
- `prompt-view`: Les champs Title et Description du mode édition utilisent le nouveau composant `MagicInput` au lieu de contrôles magic-wand séparés.

## Impact

- **Fichiers créés** : `src/shared/ui/MagicInput.tsx`
- **Fichiers modifiés** : Composants d'édition de PromptView utilisant Title/Description (à identifier lors du design)
- **Dépendances** : Aucune nouvelle dépendance — utilise uniquement React + TailwindCSS déjà en place
- **Bundle** : Impact minimal (un composant, un SVG d'icône)
- **Accessibilité** : Le bouton icône doit respecter les standards ARIA (role, aria-label, aria-disabled)
