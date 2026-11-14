# Directory Context: `/packages/rename_agent_project/src/migration`

## Purpose

Discover Codex and Claude Code conversations and prepare, apply, and restore conversation storage migrations.

## Key Exports & Entry Points

- `ConversationPlan`: read-only discovery and migration planning.
- `MigrationStorage`: backup, checked migration, and checked restoration.
- `JsonRecords`: typed JSON parsing, object checks, and compatibility with saved text replacements.
- `StorageStream`: incremental transcript records, streamed replacement preparation, and block-by-block file checksums.
- Shared migration options, database records, and backup types.
- Migration plans include warnings identifying missing transcripts whose index records remain unchanged.

## Rules

- This folder does not parse command-line arguments or import tests.
- Migration does not rename the project folder or stop applications.
- Codex migration changes selected index fields and only the initial session_meta payload.cwd; all later transcript bytes and paginated history remain unchanged.
- Claude Code message contents remain unchanged and existing destination directories are never merged.
- Transcript plans retain checksums and field transformations, never transcript text or per-record replacement arrays; older saved plans remain readable.
- New transcript and history operations read one record at a time; file checksums use fixed-size buffers.
- Backups precede storage changes and remain outside the project and active application stores.
- Transcript replacements preserve modification times so normal conversation ordering stays stable.
- Copies and directory moves call installed fs-extra operations; checked file replacements retain atomic filesystem rename.
- Unknown formats, conflicting destinations, and changed rollback targets cause refusal.

## Background

- https://github.com/jeromeetienne/coding_agent_plugin/issues/61
- https://github.com/jeromeetienne/coding_agent_plugin/issues/64
