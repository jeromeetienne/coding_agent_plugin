# rename_agent_project

Run `pnpm start --help` from `packages/rename_agent_project`.

Use Node.js 24 or later and install dependencies with `pnpm install` from the repository root. Read the [migration procedure](../../docs/conversations_after_folder_rename.md) before applying changes.

The script previews a batch migration by default. Applying changes is a one-time operation after the project folder has been renamed and the applications and background servers using the selected stores have been stopped.

Run `pnpm test` for storage safety tests and `pnpm check` for strict TypeScript checking.

The TypeScript source targets ES2020, runs through `tsx`, and exposes its public package interface in [src/index.ts](src/index.ts).
