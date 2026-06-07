## Context

The `ApiModelsSettingsView` component displays a searchable table of AI models fetched from OpenRouter. Users can toggle individual models on/off via checkboxes. The component currently supports text search filtering only. When the model catalog is large (hundreds of models), users need a quick way to see just their enabled models.

## Goals / Non-Goals

**Goals:**
- Add a boolean state toggle to filter the model table to only enabled models
- Make the toggle cumulative with existing text search
- Keep the toggle ephemeral (React state, no persistence)

**Non-Goals:**
- Locking models used by features (deferred to a future change)
- Persisting the filter state across sessions
- Adding new columns or changing the table layout beyond the filter toggle

## Decisions

### 1. Simple checkbox next to search field

**Decision**: Add a native `<input type="checkbox">` with label "Only enabled" aligned alongside the search input.

**Rationale**: Matches the existing UI pattern (native form controls, minimal styling). A segmented control or tabs would be overkill for a binary toggle. Placing it next to the search field groups all filtering controls together visually.

**Alternatives considered**:
- Segmented buttons (All / Enabled) — rejected for being visually heavier
- Dropdown filter — rejected as unnecessary for a binary choice

### 2. Compose filters in the existing `filteredModels` memo

**Decision**: Add `onlyEnabled` to the dependency array of the existing `useMemo` that computes `filteredModels`. Apply enabled filter first, then text search.

**Rationale**: Minimal code change. The filter composition is straightforward — both filters are independent and commutative, but applying enabled-filter first is slightly more efficient (fewer items to text-match).

### 3. State resets on unmount (ephemeral)

**Decision**: `useState(false)` for `onlyEnabled`. No `localStorage` or other persistence.

**Rationale**: The filter is a navigational convenience, not a user preference. Resetting on reopen is expected behavior for a settings sub-view.

## Risks / Trade-offs

- **[Risk] User expects toggle to persist** → Mitigated by the fact that the settings panel is a transient view. If users request persistence later, it can be added by moving the state to `localStorage` or IndexedDB.
- **[Trade-off] No visual indicator when toggle is active and list is empty** → If no enabled models exist and the toggle is on, the "No models match your search" empty state shows. This is acceptable — the user can uncheck the toggle to see all models.
