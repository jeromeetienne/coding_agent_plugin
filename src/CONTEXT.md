# Directory Context: `/src`

## Purpose

Migrate existing Codex and Claude Code command-line conversations after a project folder is renamed.

## Key Exports & Entry Points

- Command: `node src/migrate_conversations.mjs --help`.
- `MigrateConversations`: command-line validation and preview.
- `ConversationPlan`: selection of conversation records and directory moves.
- `MigrationStorage`: backup, checked application, and checked restoration.
- `migrate_conversations.test.mjs`: disposable storage tests with Node.js's test runner.

## Rules

- Preview is the default; writes require an explicit option and confirmation that applications using the selected stores are stopped.
- The script changes conversation storage and never renames the actual project folder.
- Codex transcript bytes and paginated history remain unchanged; only selected conversation index fields change.
- Claude Code message contents remain unchanged, and project directories move without merging existing destinations.
- Backups stay outside application storage and preserve originals before the first conversation write.
- Unknown storage formats, conflicting destinations, and changed rollback targets cause refusal.

## Background

- https://github.com/jeromeetienne/coding_agent_plugin/issues/61
