## ADDED Requirements

### Requirement: Vite base path configured for GitHub Pages
The project's `vite.config.ts` SHALL set the `base` option to `/my-prompt-manager/` so that all built asset URLs are relative to the repository sub-path served by GitHub Pages.

#### Scenario: App assets load correctly under Pages sub-path
- **WHEN** the built `dist/` folder is served at `https://cedricmenec.github.io/my-prompt-manager/`
- **THEN** all JavaScript, CSS, and static asset URLs SHALL resolve without 404 errors

#### Scenario: Local development is unaffected
- **WHEN** the developer runs `vite` (dev server)
- **THEN** the app SHALL still be accessible at `http://localhost:5173/my-prompt-manager/` with all assets loading correctly

---

### Requirement: dist and node_modules excluded from version control
The `.gitignore` file SHALL contain entries for `dist/` and `node_modules/` so that generated build output and installed packages are never committed.

#### Scenario: Build output is not tracked
- **WHEN** `npm run build` generates a `dist/` directory
- **THEN** `git status` SHALL NOT list any files under `dist/` as untracked or staged

#### Scenario: Dependencies are not tracked
- **WHEN** `npm install` or `npm ci` populates `node_modules/`
- **THEN** `git status` SHALL NOT list any files under `node_modules/` as untracked or staged

---

### Requirement: GitHub Actions workflow builds and deploys on push to main
A workflow file at `.github/workflows/deploy.yml` SHALL automatically build the Vite application and publish the `dist/` output to GitHub Pages on every push to the `main` branch.

#### Scenario: Push to main triggers deployment
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the `Deploy Vite app to GitHub Pages` workflow SHALL be triggered automatically

#### Scenario: Workflow completes successfully
- **WHEN** the workflow runs
- **THEN** it SHALL checkout the repository, set up Node.js 22, install dependencies via `npm ci`, run `npm run build`, upload the `dist/` artifact, and deploy it to GitHub Pages — all steps SHALL pass

#### Scenario: Manual trigger is supported
- **WHEN** a developer triggers the workflow manually via `workflow_dispatch`
- **THEN** the same build and deploy sequence SHALL execute

#### Scenario: App is accessible at the Pages URL after deployment
- **WHEN** the deploy job completes successfully
- **THEN** the application SHALL be accessible at `https://cedricmenec.github.io/my-prompt-manager/`

---

### Requirement: GitHub Pages source set to GitHub Actions
The GitHub repository's Pages settings SHALL use **GitHub Actions** as the build and deployment source (not a branch).

#### Scenario: Pages source is configured correctly
- **WHEN** a developer navigates to `Repository → Settings → Pages`
- **THEN** the `Build and deployment → Source` setting SHALL be set to `GitHub Actions`
