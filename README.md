# BYO Prompt Manager

A **local-first, bring-your-own-key** web app to create, organize, and reuse AI prompts.  
All data stays in your browser. No server. No account needed.

## What is this?

This app helps you manage a personal library of prompts for AI tools (ChatGPT, Claude, etc.).

- Write and edit prompts in Markdown
- Add tags, description, model hint, and temperature
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
