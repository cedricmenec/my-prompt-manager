# Prompt Search

## Purpose

Defines the real-time fuzzy search bar that filters the visible prompt list by title and description.

## Requirements

### Requirement: Search bar filters the prompt list in real-time
The system SHALL render a search input above the prompt list. As the user types, the displayed prompt list SHALL update immediately to show only prompts whose `title` or `description` matches the query using fuzzy (approximate) matching. When the query is empty, all prompts SHALL be shown.

#### Scenario: Typing a query filters the list
- **WHEN** the user types "tempate" in the search bar
- **THEN** prompts whose title or description contains "template" (or a close match) are shown, and others are hidden

#### Scenario: Exact match is always included
- **WHEN** the user types a word that exactly matches a prompt's title
- **THEN** that prompt is always included in the results

#### Scenario: Empty query shows all prompts
- **WHEN** the search input is cleared
- **THEN** all prompts are displayed, as if no filter is applied

#### Scenario: No results shows empty search state
- **WHEN** the user types a query that matches no prompts
- **THEN** an empty-state message is shown indicating no results were found for that query (distinct from the "no prompts yet" empty state)

---

### Requirement: Fuzzy search matches on title and description
The fuzzy matching SHALL be applied to both the `title` and `description` fields of each prompt. A prompt SHALL appear in results if either field fuzzy-matches the query. Matching SHALL be case-insensitive. The match threshold SHALL be tolerant enough to surface results with 1–2 character differences (e.g., missing a letter, transposed letters).

#### Scenario: Match on title
- **WHEN** the user types a near-match of a prompt's title
- **THEN** that prompt appears in the filtered list

#### Scenario: Match on description
- **WHEN** the user types a near-match of a word found only in a prompt's description
- **THEN** that prompt appears in the filtered list

#### Scenario: Case-insensitive matching
- **WHEN** the user types "TEMPLATE" or "template" or "Template"
- **THEN** the same prompts are returned regardless of case
