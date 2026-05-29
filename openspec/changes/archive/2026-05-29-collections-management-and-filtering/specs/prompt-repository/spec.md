## MODIFIED Requirements

### Requirement: IndexedDB database initialisation
The system SHALL open (or create) an IndexedDB database named `byo-prompt-manager` at version `2` (incremented to add new indexes). The database SHALL contain a single object store named `prompts` with `id` as the key path and indexes:
- `by-updatedAt` on the `updatedAt` field
- `by-tags` on the `tags` field with `multiEntry: true`
- `by-favorite` on the `isFavorite` field

#### Scenario: Migration from v1 adds the by-favorite index
- **WHEN** the app is opened in a browser with existing v1 IndexedDB data
- **THEN** the `by-favorite` index is added to the existing `prompts` store without data loss

### Requirement: update prompt
The system SHALL provide a `promptRepository.update(id: string, data: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Promise<Prompt>` method that:
- Merges the partial data into the existing prompt
- Updates `updatedAt` to the current ISO timestamp
- Persists the result and returns the updated `Prompt`
- Throws a typed `PromptNotFoundError` if no prompt with that id exists

#### Scenario: Updating favorite status is persisted
- **WHEN** `update` is called with `isFavorite: true`
- **THEN** `getById` returns the prompt with `isFavorite: true`
