# Tasks — add-library-docs-writer-skill

## 1. Scaffolding du skill

- [x] 1.1 Créer `.agents/skills/library-docs-writer/SKILL.md` avec le frontmatter YAML standard (`name: library-docs-writer`, `description`, `license: MIT`, `compatibility`, `metadata`), en suivant le format des skills `openspec-*` existants

## 2. Contenu — objectif et public

- [x] 2.1 Rédiger la section « Purpose & when to use » : documentation développeur pour une librairie/package autonome (pas une app), déclenchée explicitement ou suggérée quand l'utilisateur demande de documenter un SDK/package
- [x] 2.2 Rédiger la section « Audience & tone » : anglais simplifié, phrases courtes, un concept par section, jargon défini au premier usage, aucune supposition de contexte projet/monorepo

## 3. Contenu — structure et gabarits

- [x] 3.1 Définir la structure « Diataxis allégé » : Quickstart, Concepts, How-to guides, API reference, README d'entrée — avec le rôle et le critère « quand l'inclure / quand l'omettre » de chacune
- [x] 3.2 Fournir un squelette de fichier copiable-collable pour chaque type de page (titres de sections attendus)
- [x] 3.3 Fournir les conventions d'exemples de code : minimal, exécutable tel quel (imports inclus), sans dépendance à un contexte projet externe, sans secret réel

## 4. Contenu — workflow et maintenance

- [x] 4.1 Rédiger le workflow « créer la documentation d'une librairie à partir de zéro » (inventorier la surface publique → quickstart → concepts → how-to → référence → README d'entrée)
- [x] 4.2 Rédiger la checklist de maintenance (nouvel export non documenté, signature modifiée, API dépréciée/supprimée, exemple qui ne compile/n'exécute plus)

## 5. Vérification

- [x] 5.1 Relecture du fichier final : cohérence de format avec un skill existant (`openspec-explore/SKILL.md`), frontmatter valide, pas de référence à un package précis du monorepo
- [x] 5.2 Test à blanc : dérouler mentalement le workflow du skill sur le package `local-secret-vault` et vérifier qu'il produit un plan de pages cohérent, réutilisable comme point de départ du change `document-local-secret-vault`
