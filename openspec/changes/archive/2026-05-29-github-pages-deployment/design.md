## Context

The app is a Vite + React SPA currently developed locally. It has been pushed to a public GitHub repository (`cedricmenec/my-prompt-manager`). The goal is to publish it at `https://cedricmenec.github.io/my-prompt-manager/` with zero manual steps after each push to `main`.

Current state:
- `vite.config.ts` has no `base` option (defaults to `/`).
- `package.json` already defines `build: "tsc -b && vite build"` and `preview: "vite preview"`.
- `.gitignore` already contains `dist` and `dist-ssr` — no change needed.
- No CI/CD exists yet.

## Goals / Non-Goals

**Goals:**
- Automate build + deployment on every push to `main` via GitHub Actions.
- Ensure built assets resolve correctly under the `/my-prompt-manager/` sub-path.
- Keep the setup minimal — no custom Docker images, no caching layers beyond the built-in `setup-node` cache.

**Non-Goals:**
- Preview/staging deployments for pull requests.
- Custom domain configuration.
- Environment-specific secrets or API keys in the workflow.
- Changing the package manager for local development (stays `pnpm`).

## Decisions

### D1 — Use `pnpm` in the workflow

The project uses `pnpm` locally (has `pnpm-lock.yaml`). The CI workflow uses `pnpm/action-setup@v4` + `actions/setup-node@v4` with `cache: 'pnpm'`, then `pnpm install --frozen-lockfile` and `pnpm run build`. This aligns CI with the local package manager, avoids committing a `package-lock.json`, and uses the existing `pnpm-lock.yaml` as the frozen lockfile.

**Alternative considered:** Use `npm ci` with a committed `package-lock.json`. Rejected because `npm install` fails on the pnpm-managed `node_modules/` layout (arborist cannot traverse `.pnpm/` symlinks), making `package-lock.json` generation impractical without removing `node_modules/`.

### D2 — Set `base: '/my-prompt-manager/'` in `vite.config.ts`

GitHub Pages serves the app at `https://cedricmenec.github.io/my-prompt-manager/`. Without `base`, Vite emits asset references starting with `/` (root-relative), which 404 under a sub-path. Setting `base` to the repo name fixes all asset URLs at build time.

**Alternative considered:** Using a root-level `404.html` redirect trick. Rejected — fragile and unnecessary when `base` solves the problem cleanly.

### D3 — Use official GitHub Actions (`upload-pages-artifact` + `deploy-pages`)

The workflow uses the dedicated Pages actions rather than a third-party action (e.g., `peaceiris/actions-gh-pages`). This relies on GitHub-maintained actions, avoids third-party supply-chain risk, and is the approach GitHub's own documentation recommends.

### D4 — Two-job workflow (`build` → `deploy`)

The `build` job produces the artifact; the `deploy` job consumes it. This is required by the `actions/deploy-pages` model and also provides a cleaner separation: the build job can be inspected independently if the deploy fails.

### D5 — `dist` already excluded from git

`.gitignore` already contains `dist` and `dist-ssr`. No change required.

## Risks / Trade-offs

- **`npm ci` requires `package-lock.json`** → The lockfile must be committed alongside `package.json`. If it is absent, the CI build will fail. Mitigation: generate and commit it as part of this change's tasks.
- **`base` breaks local dev path** → With `base: '/my-prompt-manager/'`, the local dev server serves the app at `http://localhost:5173/my-prompt-manager/` instead of `/`. This is expected Vite behaviour and not a problem, but developers must be aware. Mitigation: document in README or use an env-conditional base (out of scope for this change).
- **Pages must be manually switched to GitHub Actions source once** → The first deployment will fail if the repository's Pages setting still points to a branch. Mitigation: include as an explicit manual task in `tasks.md`.

## Migration Plan

1. Add `base: '/my-prompt-manager/'` to `vite.config.ts`.
2. Generate `package-lock.json` via `npm install` and commit it.
3. Create `.github/workflows/deploy.yml`.
4. Push to `main` — workflow triggers automatically.
5. In `Repository → Settings → Pages`, set Source to **GitHub Actions** (one-time manual step).
6. Verify the workflow passes in the Actions tab.
7. Confirm the app loads at `https://cedricmenec.github.io/my-prompt-manager/`.

**Rollback:** Delete `.github/workflows/deploy.yml` and revert `vite.config.ts`. GitHub Pages will stop auto-deploying; the site will remain at whatever was last deployed until manually unpublished.

## Open Questions

- Should the `base` be made conditional (`process.env.NODE_ENV === 'production'`) to avoid the sub-path in local dev? Deferred — not required by the spec and adds complexity.
