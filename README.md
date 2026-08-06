# BYO Prompt Manager

BYO Prompt Manager is a local-first web app for people who keep a personal library of AI prompts. It lets you create, search, organize, edit, and reuse text and image prompts without an account or an application backend.

Prompt data is stored in IndexedDB in your browser. Network access is optional and happens only when you use an external feature such as OpenRouter generation or Google Drive import, export, and snapshots.

## Main features

- Create and edit text or image prompts.
- Add descriptions, notes, tags, favorites, temperature values, and reference images.
- Search prompts and browse them as a list or image gallery.
- Store prompts and local image assets in the browser.
- Import and export versioned JSON backups.
- Use an OpenRouter API key to generate a prompt title or description.
- Export, import, and restore visible files in a user-owned Google Drive folder.
- Protect API credentials in an optional encrypted local vault.

## Getting Started

### Prerequisites

The repository workflow uses:

- [Node.js](https://nodejs.org/) 22
- [pnpm](https://pnpm.io/) 10

### Run the app

1. Clone the repository.

   ```bash
   git clone https://github.com/cedricmenec/my-prompt-manager.git
   cd my-prompt-manager
   ```

2. Install the dependencies.

   ```bash
   pnpm install
   ```

3. Start the development server.

   ```bash
   pnpm dev
   ```

4. Open <http://localhost:5173/my-prompt-manager/>.

On the first visit, create an encrypted vault or choose the session-only option. When the prompt list appears, select **New Prompt** to create your first prompt.

## Privacy and data

The app has no application server and does not require an account.

- Prompts, settings, and local reference images stay in browser storage by default.
- An OpenRouter key stays in memory in session-only mode. If the encrypted vault is enabled and unlocked, the key can be stored locally in the vault.
- Prompt content is sent to OpenRouter only when you start an AI generation action.
- Google OAuth access tokens stay in memory for the current browser session.
- Local JSON exports and Google Drive files are not encrypted. They can contain prompt data and local prompt images.
- Exports do not contain API keys, OAuth tokens, client secrets, or vault passphrases.

Keep your API keys private. Back up important prompts before clearing browser data. An import replaces the current local prompt collection after confirmation.

## Optional OpenRouter setup

1. Open **Settings** and select **API & Models**.
2. Enter your own OpenRouter API key.
3. Load the model catalog and enable a text or multimodal model.
4. Open **AI Features** and select the model for the prompt input assistant.

Generation is always explicit. Generated values are added to the edit form and are stored only after you save the prompt. API use and provider costs remain your responsibility.

## Optional Google Drive setup

The Drive integration uses your own Google Cloud project and Drive folder. It does not use a backend, shared client secret, refresh-token store, or app-owned Google account.

1. Create or select a project in Google Cloud Console.
2. Configure its OAuth consent screen.
3. Create an OAuth client ID with the **Web application** type.
4. Add the app origin as an authorized JavaScript origin. For local development, use `http://localhost:5173`. Do not add `/my-prompt-manager/` to the origin.
5. Create a visible folder in your Google Drive.
6. In **Settings**, enter the OAuth client ID and the Drive folder URL or ID, then save.
7. Connect Google Drive and use **Test folder** to check write access.

The app requests the `drive.file` scope. The folder test creates and then deletes a small temporary JSON file. Drive snapshots are optional and use a configurable interval from 5 to 1,440 minutes.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Vite development server. |
| `pnpm build` | Build the vault package, type-check the workspace, and create `dist/`. |
| `pnpm preview` | Preview the production build locally. |
| `pnpm lint` | Run ESLint. |
| `pnpm test` | Run the Vitest test suite once. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm test:coverage` | Run tests and create a coverage report. |

## Project structure

```text
src/
├── app/              Application root
├── application/      Application services
├── domain/           Prompt schemas and domain logic
├── features/         Prompt, layout, settings, and vault UI
├── infrastructure/   IndexedDB, AI, Drive, import, and export adapters
├── shared/           Shared UI and utilities
└── styles/           Global styles and Tailwind theme
packages/
└── encrypted-vault/  Reusable encrypted vault SDK
```

The app is built with React, TypeScript, Vite, Tailwind CSS, Zod, IndexedDB, and Vitest. It is deployed as static files through GitHub Pages.

## Contributing

The project is not yet mature enough to support external contributions effectively. Contribution guidelines will be published as soon as the process is ready. Thank you for your interest and understanding.

## Next

- Read the [project architecture and conventions](openspec/project.md).
- Browse the [current behavior specifications](openspec/specs/).
- See the [`@byo-prompt/encrypted-vault` package guide](packages/encrypted-vault/README.md).
- Review [features that are still deferred](deferred-features.md).
