## 1. Composant MagicInput

- [x] 1.1 Créer `src/shared/ui/MagicInput.tsx` avec le type d'interface `MagicInputProps` étendant `InputHTMLAttributes<HTMLInputElement>` ou `TextareaHTMLAttributes<HTMLTextAreaElement>` selon la variante
- [x] 1.2 Implémenter le rendu conditionnel `<input>` (variant="single") vs `<textarea>` (variant="multi") dans un conteneur `relative`
- [x] 1.3 Ajouter le bouton icône SVG baguette magique positionné en `absolute` à droite du champ, avec `aria-label="Generate with AI"`
- [x] 1.4 Implémenter le style `padding-right: 2.5rem` sur le champ pour laisser l'espace à l'icône
- [x] 1.5 Ajouter le keyframe CSS `pulse-magic` pour l'animation de pulsation subtile avec changement de couleur (teinte pourpre)
- [x] 1.6 Implémenter la logique `isGenerating` : quand `true`, l'icône pulse et le bouton est `aria-disabled="true"`, le `onMagicAction` n'est pas invoqué
- [x] 1.7 Exporter le composant depuis `src/shared/ui/index.ts` (ou depuis le fichier directement)

## 2. Tests du composant MagicInput

- [x] 2.1 Créer `src/shared/ui/MagicInput.test.tsx` avec les tests de rendu pour les variantes "single" et "multi"
- [x] 2.2 Tester que le clic sur l'icône déclenche `onMagicAction` quand `isGenerating` est `false`
- [x] 2.3 Tester que le clic sur l'icône ne déclenche PAS `onMagicAction` quand `isGenerating` est `true`
- [x] 2.4 Tester que les props native (placeholder, value, onChange) sont correctement transmises à l'élément natif
- [x] 2.5 Tester que le bouton icône a un `aria-label` valide et est désactivé pendant la génération

## 3. Intégration dans PromptView

- [x] 3.1 Importer `MagicInput` dans `src/features/prompts/PromptView.tsx`
- [x] 3.2 Remplacer le bloc Title (label + bouton AI séparé + input) par un `MagicInput variant="single"` avec `onMagicAction={() => handleGenerateField('title')}` et `isGenerating={generatingField === 'title'}`
- [x] 3.3 Remplacer le bloc Description (label + bouton AI séparé + textarea) par un `MagicInput variant="multi"` avec `onMagicAction={() => handleGenerateField('description')}` et `isGenerating={generatingField === 'description'}`
- [x] 3.4 Vérifier que les erreurs de validation (`errors.title`) s'affichent toujours sous le champ

## 4. Nettoyage et validation

- [x] 4.1 Supprimer les anciens boutons AI séparés et le code de rendering associé dans PromptView
- [x] 4.2 Vérifier que le mode édition fonctionne correctement (génération, sauvegarde, annulation)
- [x] 4.3 Lancer les tests existants (`pnpm test`) pour vérifier qu'aucune régression n'est introduite
- [x] 4.4 Lancer le linter (`pnpm lint`) et corriger les éventuelles erreurs
