## Why

The application needs a zero-friction, automated delivery pipeline so every push to `main` is instantly published. Without it, deployments are manual and error-prone, and there is no publicly accessible URL for the app.

## What Changes

- Add a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the Vite app and deploys it to GitHub Pages on every push to `main`.
- Set the `base` path in `vite.config.ts` to match the GitHub repository name (`/my-prompt-manager/`) so assets resolve correctly under the Pages sub-path.
- Confirm `dist/` and `node_modules/` are excluded from version control in `.gitignore`.
- Switch the GitHub Pages source (in repository Settings → Pages) from a branch to **GitHub Actions**.

## Capabilities

### New Capabilities
- `github-pages-deployment`: End-to-end CI/CD pipeline that builds the Vite app and publishes the `dist/` output to GitHub Pages via a GitHub Actions workflow; includes the required Vite `base` configuration and `.gitignore` hygiene.

### Modified Capabilities
<!-- No existing spec-level requirements are changing. -->

## Impact

- **`vite.config.ts`**: `base` option added/updated to `/my-prompt-manager/`.
- **`.github/workflows/deploy.yml`**: New file — build + deploy workflow.
- **`.gitignore`**: Verify `dist/` is ignored (no content change expected).
- **Dependencies**: No new runtime dependencies; GitHub Actions uses `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`, `actions/deploy-pages` (all official GitHub actions, no npm additions).
- **Build system**: Node 22, `npm ci`, `npm run build` (matches existing `package.json` scripts).
