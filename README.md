# BYO Prompt Manager

A **local-first, bring-your-own-key** web app to create, organize, and reuse AI prompts.  
All data stays in your browser. No server. No account needed.

## What is this?

This app helps you manage a personal library of prompts for AI tools (ChatGPT, Claude, etc.).

- Write and edit prompts in Markdown
- Add tags, description, notes, image references, and temperature
- All data is stored in your browser (IndexedDB) — nothing is sent to a server
- Works offline after the first load

## Tech stack

- **React 19** + **TypeScript** (strict mode)
- **Vite** for dev server and build
- **Tailwind CSS v4** for styling
- **Zod** for data validation
- **idb** for IndexedDB access
- **js-yaml** for Markdown frontmatter
- **Vitest** for unit tests

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/byo-prompt-manager-webapp.git
cd byo-prompt-manager-webapp
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the local dev server with hot reload |
| `pnpm build` | Build the app for production (output in `dist/`) |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run the unit test suite |
| `pnpm test:coverage` | Run tests and show coverage report |

## How to use the app

1. Click **+ New Prompt** to create your first prompt.
2. Fill in the title, content (Markdown supported), and optional tags.
3. Click **Save** — the prompt appears in the list.
4. Click any prompt card to open the detail panel.
5. Use **Edit** to change a prompt, **Copy** to copy content to clipboard, or **Delete** to remove it.

## AI assistant and BYOK keys

Settings includes **API & Models** for loading an OpenRouter model catalog with your own API key and enabling models for app features. The key is kept in memory for the current browser session only; it is not saved to localStorage, IndexedDB, JSON exports, Drive exports, or Drive snapshots. A page reload clears it.

Settings also includes **AI Features**. The first feature, **Prompt input assistant**, stores only a non-sensitive provider/model selection and can generate a prompt title or description from the current prompt content. Generation is explicit: prompt content is sent to OpenRouter only when you click an AI generation control in edit mode. Generated values update the edit form and are saved only when you click **Save**.

Prompt records no longer include a prompt-level `model` field. Legacy imports or Markdown frontmatter that contain `model` are accepted, but the field is stripped and future exports omit it.

## Google Drive import, export, and snapshots

Google Drive is optional and user-owned. The app stays static and browser-only: it does not use a
backend, a shared OAuth client secret, a refresh token store, or an app-owned Google account.

### Google Cloud setup

1. In Google Cloud Console, create or choose a project.
2. Configure the OAuth consent screen for your own use.
3. Create an OAuth Client ID with the **Web application** type.
4. Add the **Authorized JavaScript origin** where this static app runs, such as
   `http://localhost:5173` for development or your GitHub Pages origin for production.
   Do not include a path like `/my-prompt-manager/` in the origin.
5. Copy only the OAuth Client ID into Settings. Do not create, paste, store, or share a client
   secret for this browser app.

The Drive integration requests `https://www.googleapis.com/auth/drive.file`. Access tokens are kept
in memory for the current browser session only. When the session expires, reconnect from Settings.
The app uses the Google Identity Services token popup flow, so it does not require an Authorized
redirect URI.

### Drive folder setup

Create a visible Google Drive folder yourself, then paste either its folder URL or folder ID into
Settings. Use **Test folder** to confirm the app can write to it. The test creates a small
temporary `.byo-prompt-manager-folder-test-*.json` file and then deletes it; this avoids relying on
folder metadata reads that may be blocked by the `drive.file` scope. Drive Picker, hidden
`appDataFolder` sync, conflict resolution, encrypted vault support, and encrypted secret export are
deferred.

### Workflows

- **Local export/import**: Settings -> Data keeps the offline JSON download and file import flow.
  It does not require Google Drive.
- **Drive export**: Settings -> Google Drive -> connect, then use **Export to Drive**. The app
  uploads the same prompt export envelope to the configured folder.
- **Drive import**: load Drive exports, select a JSON export, and confirm replacement. The same
  parsing, schema validation, and replacement flow as local import is used.
- **Snapshots**: enable visible Drive snapshots and keep the default 15 minute interval or choose a
  whole number from 5 to 1440 minutes. Snapshots are created after successful manual Drive exports,
  before Drive imports/restores when possible, and automatically while connected when exportable
  data changed since the last successful snapshot.
- **Restore**: load snapshots, select one, and confirm replacement. Invalid or unsupported snapshot
  payloads are rejected before local prompt data is modified.

Prompt exports and snapshots are unencrypted by default and are visible files in your Drive folder.
They include prompt data, local prompt image assets, schema metadata, and app metadata. They do not
include AI API keys, OAuth access tokens, OAuth refresh tokens, client secrets, passphrases, or
connector secrets.

## Project structure

```
src/
├── app/              # App root component
├── domain/           # Prompt schema (Zod) and Markdown parser
├── infrastructure/   # IndexedDB repository
├── features/prompts/ # UI components and state (context + reducer)
├── shared/ui/        # Reusable UI primitives (Button, Badge, Modal, Toast)
└── styles/           # Global CSS and Tailwind theme tokens
```
