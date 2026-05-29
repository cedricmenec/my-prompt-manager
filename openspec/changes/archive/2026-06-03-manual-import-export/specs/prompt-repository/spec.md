## ADDED Requirements

### Requirement: deleteAll prompts
The system SHALL provide a `promptRepository.deleteAll(): Promise<void>` method that removes all prompts from the `prompts` object store in a single IndexedDB transaction.

#### Scenario: All prompts are removed after deleteAll
- **WHEN** `deleteAll` is called on a store containing prompts
- **THEN** `getAll` returns `[]` immediately after

#### Scenario: deleteAll on empty store is a no-op
- **WHEN** `deleteAll` is called on an empty store
- **THEN** the promise resolves without throwing
