# rename_agent_project

`rename_agent_project` is a TypeScript tool under development for renaming a local repository folder while preserving the repository's Codex and Claude Code conversations. The intended result is that the developer opens the renamed folder normally and finds the existing conversations with their earlier context.

## Current implementation

The current command migrates conversation associations after a folder has been renamed manually. The command can preview the affected conversations, apply the migration with a backup, and restore the migration from that backup. Folder renaming and application shutdown are still manual operations.

The complete automated rename workflow is tracked in [the tool implementation issue](https://github.com/jeromeetienne/coding_agent_plugin/issues/64). The [existing migration procedure](../../docs/conversations_after_folder_rename.md) documents the current behaviour and its limits.

## Run the command

Use Node.js 24 or later. Install dependencies from the repository root with `pnpm install`, then list the supported options:

```bash
pnpm --filter rename_agent_project start --help
```

Preview is the default when `--from` and `--to` are supplied. `--apply` writes a migration, and `--restore <backup>` selects restoration. All supported options are defined in [src/cli.ts](src/cli.ts).

## Development

From the repository root:

```bash
pnpm --filter rename_agent_project test
pnpm --filter rename_agent_project check
```

The source uses strict TypeScript with an ES2020 target and runs through `tsx`.

## Source structure

- [src/index.ts](src/index.ts): public package exports.
- [src/cli.ts](src/cli.ts): command-line options and operation dispatch.
- [src/migration](src/migration): conversation discovery, migration, backup, restoration, and shared types.
- [src/tests](src/tests): automated tests using disposable data.

## Testing scope

Development testing uses synthetic folders and conversations only. The planned application-level testbed contains `rename_agent_test_project`, synthetic files, three new Claude Code conversations, and three new Codex conversations. Actual user project folders and existing conversations are excluded from testing. The approved process is recorded in the tool implementation issue linked above.
