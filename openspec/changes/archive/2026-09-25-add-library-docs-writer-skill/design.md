# Design — Créer un agent skill « library-docs-writer »

## Context

Voir proposal.md — Why. Contexte technique seulement :

- Les skills projet existants (`.agents/skills/openspec-*`) sont chacun un unique fichier `SKILL.md` avec un frontmatter YAML (`name`, `description`, `allowed-tools` optionnel, `license`, `compatibility`, `metadata: { author, version, generatedBy }`), suivi d'instructions en Markdown à destination d'un agent IA. Aucun manifeste séparé ne référence les skills : ils sont découverts automatiquement par leur emplacement.
- Le package `packages/local-secret-vault/` a aujourd'hui un seul `README.md` (déjà correct sur la forme : install, usage, tableau des entry points, tableau d'API) mais rédigé du point de vue d'un contributeur du monorepo — pas structuré pour un consommateur externe qui découvre la librairie sans contexte, et sans séparation entre « je démarre », « je comprends le modèle », « je veux faire X » et « je cherche la signature exacte ».
- Aucun skill du projet ne couvre la rédaction de documentation développeur pour une librairie découplée — seuls les skills `openspec-*` existent, tous liés au workflow de spec.

## Goals / Non-Goals

**Goals:**
- Un skill générique, indépendant de tout package précis, activable pour n'importe quelle librairie/SDK découplé du monorepo (aujourd'hui `local-secret-vault`, demain d'autres extractions).
- Une structure de documentation concrète et actionnable (pas juste des principes abstraits) que le change `document-local-secret-vault` peut appliquer directement.
- Une checklist de maintenance explicite, pour que la documentation reste à jour quand l'API publique change (nouvel export, signature modifiée, dépréciation).
- Ton et style codifiés de façon vérifiable : anglais simplifié, phrases courtes, un concept par section, exemples de code exécutables tels quels.

**Non-Goals:**
- Pas un guide de style rédactionnel général (blog, marketing) — uniquement documentation développeur de librairie.
- Pas de génération automatique de doc à partir des commentaires TSDoc (ex. TypeDoc) — la documentation reste écrite à la main en Markdown ; ce serait une extension future possible mais hors périmètre.
- Pas de site de documentation versionné/publié (Docusaurus, VitePress...) — uniquement des fichiers Markdown dans le repo du package.
- Pas de traduction : le skill produit de la documentation en anglais uniquement (le reste du projet — proposals, specs — reste en français, sans changement).

## Decisions

### D1 — Structure « Diataxis allégé » plutôt qu'un unique README

Quatre familles de contenu, calquées sur les quatre besoins classiques d'un lecteur de doc technique (Diataxis : tutoriels, guides pratiques, explications, référence) mais simplifiées :
1. **Quickstart** — un chemin linéaire installation → premier résultat concret.
2. **Concepts** — les idées qu'il faut comprendre une fois (modèle mental), référencées ailleurs plutôt que répétées.
3. **How-to guides** — des recettes ciblées pour des tâches précises.
4. **API reference** — la source de vérité exhaustive (signatures, types, erreurs).
Le `README.md` du package devient un point d'entrée court (pitch, install, un exemple minimal) qui pointe vers ces quatre pages.

*Alternative* : tout garder dans un unique long README — rejetée : un README qui mélange démarrage rapide, modèle mental et référence exhaustive devient illisible dès que l'API dépasse quelques fonctions, et oblige le lecteur pressé à scroller au milieu du contenu de référence.

### D2 — Style codifié en checklist actionnable, pas en prose générale

Le skill liste des règles vérifiables (phrases courtes, un concept par section, pas de jargon non défini, exemples auto-suffisants avec imports complets) plutôt que des recommandations générales de « bien écrire ». Un agent qui applique le skill doit pouvoir se relire avec la checklist et cocher chaque point.

*Alternative* : renvoyer vers un guide de style externe générique (ex. Google Developer Documentation Style Guide) — rejetée : ajoute une dépendance externe et une indirection ; le projet préfère des skills auto-suffisants (cf. skills `openspec-*` existants, tous autonomes).

### D3 — Skill invoqué explicitement par nom, pas par heuristique de mots-clés

Cohérent avec les skills existants (`openspec-explore`, etc.) : le skill est prévu pour être appelé explicitement (`/library-docs-writer` ou équivalent), avec une `description` frontmatter suffisamment précise pour que l'agent hôte puisse aussi le suggérer quand pertinent (ex. « l'utilisateur demande de documenter un package/SDK »).

### D4 — Paramétrique sur l'emplacement, jamais lié à un package précis

Le skill ne mentionne aucun nom de package existant. Ses instructions décrivent l'emplacement des livrables en termes génériques (`packages/<name>/README.md` + `packages/<name>/docs/**`) pour rester valide après l'extraction de `local-secret-vault` dans son propre dépôt, et pour s'appliquer à toute librairie future.

## Risks / Trade-offs

- [Le skill devient obsolète si les conventions de doc de l'équipe évoluent] → fichier unique, court, facile à relire/mettre à jour ; pas de duplication de règles ailleurs.
- [Confusion avec les skills `openspec-*` existants] → `description` du frontmatter explicitement scopée à « developer documentation for a standalone library/package », distincte du workflow OpenSpec.
- [Checklist trop rigide pour des cas particuliers] → le skill autorise explicitement d'omettre une page (ex. pas de how-to guides si la librairie n'a qu'une seule façon de l'utiliser) plutôt que d'imposer les 4 pages dans tous les cas.

## Migration Plan

Aucune migration — ajout d'un unique fichier, pas d'impact sur le code ou les données existantes. Rollback trivial : suppression du fichier.

## Open Questions

<!-- Aucune. -->
