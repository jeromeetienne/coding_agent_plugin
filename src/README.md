# Conversation migration script

Run `node src/migrate_conversations.mjs --help` from the repository root.

Use Node.js 24 or later and install dependencies with `pnpm install`. Read the [migration procedure](../docs/conversations_after_folder_rename.md) before applying changes.

The script previews a batch migration by default. Applying changes is a one-time operation after the project folder has been renamed and the applications and background servers using the selected stores have been stopped.

Run `pnpm test` for storage safety tests and `pnpm check` for JavaScript type checking.
