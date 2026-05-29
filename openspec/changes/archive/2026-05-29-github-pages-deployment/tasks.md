## 1. Vite Configuration

- [x] 1.1 Add `base: '/my-prompt-manager/'` to `vite.config.ts`
- [x] 1.2 Run `npm run build` locally and verify `dist/` is generated without errors
- [x] 1.3 Run `npm run preview` and confirm the app loads at `http://localhost:4173/my-prompt-manager/` with no 404s on assets

## 2. Lockfile

- [x] 2.1 ~~Run `npm install` to generate `package-lock.json`~~ — N/A: switched to pnpm in CI; `pnpm-lock.yaml` already present
- [x] 2.2 ~~Confirm `package-lock.json` is not listed in `.gitignore`~~ — N/A: no `package-lock.json` needed

## 3. GitHub Actions Workflow

- [x] 3.1 Create `.github/workflows/deploy.yml` with the build + deploy workflow (Node 22, `pnpm install --frozen-lockfile`, `pnpm run build`, `upload-pages-artifact`, `deploy-pages`)
- [x] 3.2 Verify the workflow file uses `permissions: contents: read / pages: write / id-token: write`
- [x] 3.3 Verify the `concurrency` group is set to `pages` with `cancel-in-progress: false`

## 4. Commit and Push

- [X] 4.1 Stage `vite.config.ts`, `package-lock.json`, and `.github/workflows/deploy.yml`
- [X] 4.2 Commit with message `Configure GitHub Pages deployment`
- [X] 4.3 Push to `main`

## 5. GitHub Repository Settings

- [X] 5.1 Navigate to `Repository → Settings → Pages`
- [X] 5.2 Set `Build and deployment → Source` to **GitHub Actions**

## 6. Verify Deployment

- [x] 6.1 Navigate to `Repository → Actions` and confirm the `Deploy Vite app to GitHub Pages` workflow is running/passed
- [x] 6.2 Open `https://cedricmenec.github.io/my-prompt-manager/` and verify the app loads correctly with no console 404 errors
