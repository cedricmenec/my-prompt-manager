## Context

L'application utilise déjà React 19 + TailwindCSS 4 avec un ensemble de composants réutilisables dans `src/shared/ui/` (`Button`, `Badge`, `Modal`, `Toast`). Le feature `prompt-input-ai-assistant` fonctionne — la génération IA de titre/description est opérationnelle via `promptFieldGenerationService`.

Dans `PromptView.tsx` (mode édition), les contrôles de génération IA sont actuellement des boutons séparés placés à côté des labels `Title` et `Description` :

```tsx
<div className="mb-1 flex items-center gap-2">
  <label>Title *</label>
  <button onClick={() => handleGenerateField('title')} disabled={generatingField !== null}>
    AI
  </button>
</div>
<input type="text" ... />
```

Ce patternduplique la logique UI (positionnement, disabled state, aria-labels) et sera à dupliquer à chaque nouveau champ assisté par IA.

## Goals / Non-Goals

**Goals:**
- Créer un composant `MagicInput` réutilisable combinant input/textarea + icône baguette magique intégrée
- Extraire le pattern UI des boutons de génération IA de `PromptView` vers un composant partagé
- Préparer le terrain pour de futurs champs IA-générables sans duplication de code
- Suivre les patterns existants (comme `Button.tsx`)

**Non-Goals:**
- Modifier le `promptFieldGenerationService` (logique métier inchangée)
- Ajouter de nouvelles capacités de génération IA
- Créer un menu dropdown d'actions IA (pour l'instant, un seul clic = une action)
- Refactoriser l'ensemble du formulaire d'édition

## Decisions

### 1. Un seul composant `MagicInput` avec prop `variant`

**Choix** : `MagicInput` accepte `variant: 'single' | 'multi'` pour contrôler `<input>` vs `<textarea>`.

**Alternative considérée** : Deux composants séparés (`MagicInput` + `MagicTextarea`).

**Rationale** : Un seul composant réduit la surface API et la duplication. Le comportement commun (icône, animation, disabled, pass-through props) est identique. La différence est uniquement l'élément DOM rendu.

### 2. Positionnement de l'icône par padding-right + position absolute

**Choix** : Le champ a un `padding-right` suffisant pour laisser de l'espace à l'icône. L'icône est positionnée en `absolute` à droite dans un conteneur `relative`.

**Alternative considérée** : Flexbox avec le champ et l'icône comme frères.

**Rationale** : Le positionnement absolute dans un conteneur relatif est le pattern standard pour les icônes intégrées dans des inputs (cf. icon inputs dans Tailwind UI, shadcn/ui). Le flexbox nécessiterait de gérer la largeur de l'icône comme espace réservé, ce qui complique le style natif du champ.

### 3. Animation CSS avec `@keyframes` Tailwind custom

**Choix** : Définir une animation `@keyframes` pulse dans le CSS du composant (ou dans `index.css`) avec un changement de couleur subtil (opacity + teinte).

**Alternative considérée** : Utiliser la classe utilitaire `animate-pulse` de Tailwind.

**Rationale** : `animate-pulse` de Tailwind pulse l'opacité de tout l'élément, ce qui est trop agressif. Un keyframe custom permet de contrôler précisément :
- L'animation concerne uniquement l'icône, pas le champ
- La couleur glisse subtilement vers l'accent (teinte pourpre)
- L'effet est moderne et discret

### 4. Icône SVG inline (pas de dépendance externe)

**Choix** : Utiliser un SVG de baguette magique inline dans le composant.

**Alternative considérée** : Bibliothèque d'icônes (lucide-react, heroicons).

**Rationale** : Ajouter une dépendance pour un seul SVG n'est pas justifié. Le SVG est petit (~200 bytes), contrôlable, et évite un risque de dépendance. On peut toujours migrer vers une bibliothèque si le nombre d'icônes croît.

### 5. Props composition via spread

**Choix** : `MagicInput` étend `InputHTMLAttributes` / `TextareaHTMLAttributes` et spread les props restantes sur l'élément natif.

**Rationale** : C'est le pattern établi par `Button.tsx` (qui étend `ButtonHTMLAttributes`). Cela permet de passer `placeholder`, `value`, `onChange`, `className`, `aria-*`, etc. sans definir chaque prop explicitement.

### 6. Intégration dans PromptView

**Choix** : Remplacer les blocs label + bouton séparé + input par un seul `MagicInput` avec `onMagicAction` pointant vers `handleGenerateField`.

**Avant :**
```tsx
<div>
  <div className="mb-1 flex items-center gap-2">
    <label>Title *</label>
    <button onClick={...}>AI</button>
  </div>
  <input type="text" value={title} onChange={...} />
</div>
```

**Après :**
```tsx
<div>
  <label>Title *</label>
  <MagicInput
    variant="single"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    onMagicAction={() => handleGenerateField('title')}
    isGenerating={generatingField === 'title'}
    placeholder="Prompt title"
  />
</div>
```

La logique `handleGenerateField`, `generatingField`, et le state restent dans `PromptView` — seule la couche UI change.

## Risks / Trade-offs

| Risque | Impact | Mitigation |
|--------|--------|------------|
| L'icône empiète sur le texte saisi si le champ est très étroit | UX | Padding-right suffisant (2.5rem), pas de texte tronqué car le scroll natif gère ça |
| La spécificité CSS du keyframe pourrait causer des conflits | Faible | Le keyframe est scopé au composant via un `<style>` ou classe nommée unique |
| Futur ajout d'un dropdown au clic sur l'icône nécessiterait de modifier `MagicInput` | Moyen | L'interface `onMagicAction: () => void` est suffisamment générique — on pourrait la faire évoluer vers `onMagicAction: (action?: string) => void` si besoin |
| `generatingField` reste dans PromptView et pas encapsulé | Faible | C'est volontaire — la logique métier reste dans le composant feature, MagicInput est purement UI |
