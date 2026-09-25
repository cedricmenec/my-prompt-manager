## Why

The `@byo-prompt` namespace no longer reflects the intended branding for the encrypted vault SDK. The preferred namespace is `@activarium`, so the package should be published and consumed as `@activarium/encrypted-vault`.

## What Changes

- Rename the workspace package from `@byo-prompt/encrypted-vault` to `@activarium/encrypted-vault`
- Update the root `package.json` dependency and `build:vault` script filter
- Update all imports across the app (`src/`) to use `@activarium/encrypted-vault`
- Update the package README, source header comments, and the root README
- Update the pnpm lockfile entry
- Update the openspec specs and project documentation to reference the new namespace

## Capabilities

### Modified Capabilities

- `encrypted-vault`: Package name and all references updated from `@byo-prompt/encrypted-vault` to `@activarium/encrypted-vault`
- `encrypted-vault-core`: Documentation references updated to the new namespace
- `encrypted-vault-react`: Documentation references updated to the new namespace
- `encrypted-vault-storage-indexeddb`: Documentation references updated to the new namespace

## Impact

- **package.json** (root): dependency renamed to `@activarium/encrypted-vault`
- **packages/encrypted-vault/package.json**: `name` field updated
- **pnpm-lock.yaml**: lockfile entry updated
- **src/**: all vault imports updated to the new namespace
- **openspec/**: specs and project docs updated