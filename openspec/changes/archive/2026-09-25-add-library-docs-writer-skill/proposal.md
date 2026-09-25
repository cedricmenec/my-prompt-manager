# Créer un agent skill « library-docs-writer »

## Why

Aucun skill du projet ne couvre aujourd'hui la rédaction de documentation développeur pour une librairie/package découplé (README + guides). Le package `local-secret-vault` va bientôt être externalisé en npm à part (voir `deferred-features.md` / renommages précédents) : sa documentation doit être écrite comme si elle s'adressait à un consommateur externe qui ne connaît rien de `my-prompt-manager`, et ce besoin va se reproduire pour d'autres extractions futures. Plutôt que de rédiger cette documentation une fois « à la main », on capture la méthode dans un skill réutilisable, pour que la qualité et la structure restent cohérentes à chaque nouvelle librairie et à chaque mise à jour.

## What Changes

- Nouveau skill projet `.agents/skills/library-docs-writer/SKILL.md` (en anglais, format identique aux skills `openspec-*` existants : frontmatter `name`/`description`/`license`/`compatibility`/`metadata`).
- Le skill définit : le public visé et le ton (développeur, anglais simplifié, phrases courtes), une structure de documentation façon « Diataxis allégé » (Quickstart, Concepts, How-to guides, API reference, README d'entrée), des conventions d'exemples de code (minimaux, auto-suffisants, copiables-collables), un workflow pour créer la documentation d'une librairie à partir de zéro, et une checklist de maintenance pour la garder synchronisée avec le code (nouvel export, signature modifiée, API supprimée).
- Le skill est générique : il ne référence aucun package précis (`local-secret-vault` ou autre) et reste applicable à n'importe quelle librairie découplée, y compris après extraction dans un dépôt séparé.
- **Non-change** : ce change ne modifie aucun comportement du produit ni des packages existants — uniquement l'ajout d'un fichier de méthodologie pour les agents.

## Capabilities

### New Capabilities

<!-- Aucune capacité produit — un skill n'est pas une exigence comportementale du logiciel. -->

### Modified Capabilities

<!-- Aucune. -->

## Specs : skip délibéré

Ce change ajoute un artefact de tooling (un skill pour les agents), pas une fonctionnalité du produit ou d'un package. Aucune spec de `openspec/specs/**` ne décrit ni ne décrira le comportement d'un skill projet. `skip_specs: true` est donc posé dans `.openspec.yaml`.

## Impact

- **Nouveau fichier** : `.agents/skills/library-docs-writer/SKILL.md`.
- **Aucun** changement de code produit, de dépendance, ou de spec.
- **Utilisation prévue** : ce skill sera invoqué par le change `document-local-secret-vault` pour produire la documentation développeur du package `local-secret-vault`, puis réutilisable pour toute librairie future du monorepo (ou après son extraction).
