## Context

The encrypted vault SDK was extracted into a workspace package named `@byo-prompt/encrypted-vault`. The `@byo-prompt` namespace is being replaced by `@activarium` to match the intended branding. This is a pure rename: no functional, API, or behavioral change.

## Goals / Non-Goals

**Goals:**
- Rename the package to `@activarium/encrypted-vault` everywhere it is referenced
- Keep the package as a pnpm workspace package (`workspace:*`)

**Non-Goals:**
- Not publishing to npm (still a monorepo workspace package)
- Not changing the package structure, entry points, or public API
- Not changing the encryption algorithm or vault behavior

## Decisions

### Decision: Keep `workspace:*` specifier
The package remains a pnpm workspace dependency. Only the package name changes; the `workspace:*` specifier is preserved so the app continues to consume the local package as if it were external.

### Decision: Leave historical archive untouched
The archived change `2026-07-04-extract-encrypted-vault-sdk` documents the state at extraction time and is not rewritten.