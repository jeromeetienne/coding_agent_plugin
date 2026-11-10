# Directory Context: `/packages/rename_agent_project/src`

## Purpose

Provide the public package interface and the command-line entry point for rename_agent_project.

## Key Exports & Entry Points

- `index.ts`: the public package interface.
- `cli.ts`: all supported command-line options and operation dispatch.
- `migration/`: conversation discovery, migration plans, storage changes, and shared types; see [CONTEXT.md](migration/CONTEXT.md).
- `tests/`: disposable storage and command-line tests; see [CONTEXT.md](tests/CONTEXT.md).
- Command from the repository root: `pnpm --filter rename_agent_project start --help`.

## Rules

- Only index.ts and cli.ts are TypeScript files directly in this folder.
- Implementation and tests stay in their respective subfolders.
- All command-line options are declared in cli.ts.
- Internal modules import specific implementation files rather than the public package interface.

## Background

- https://github.com/jeromeetienne/coding_agent_plugin/issues/64
