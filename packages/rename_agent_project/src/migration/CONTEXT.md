# Directory Context: `/packages/rename_agent_project/src/migration`

## Purpose

Discover Codex and Claude Code conversations and prepare, apply, and restore conversation storage migrations.

## Key Exports & Entry Points

- `ConversationPlan`: read-only discovery and migration planning.
- `MigrationStorage`: backup, checked migration, and checked restoration.
- `JsonRecords`: typed JSON parsing and object checks.
- Shared migration options, database records, and backup types.

## Rules

- This folder does not parse command-line arguments or import tests.
- Migration does not rename the project folder or stop applications.
- Codex transcript bytes and paginated history remain unchanged; only selected index fields change.
- Claude Code message contents remain unchanged and existing destination directories are never merged.
- Backups precede storage changes and remain outside the project and active application stores.
- Unknown formats, conflicting destinations, and changed rollback targets cause refusal.

## Background

- https://github.com/jeromeetienne/coding_agent_plugin/issues/61
- https://github.com/jeromeetienne/coding_agent_plugin/issues/64
