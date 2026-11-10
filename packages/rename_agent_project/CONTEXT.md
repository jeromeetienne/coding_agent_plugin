# Directory Context: `/packages/rename_agent_project`

## Purpose

Own the rename_agent_project tool and its package configuration.

## Key Exports & Entry Points

- `src/`: conversation migration implementation and tests; see [CONTEXT.md](src/CONTEXT.md).
- Command-line entry point: src/cli.ts.
- Command from this package: `pnpm start --help`.
- [README.md](README.md): package usage and verification commands.

## Rules

- Runtime and development dependencies belong in this package's package.json.
- TypeScript uses strict checking with an ES2020 target and runs through tsx.
- The public package interface is src/index.ts.
- The package does not rename project folders or stop applications automatically.

## Background

- [Repository context](../../CONTEXT.md)
- https://github.com/jeromeetienne/coding_agent_plugin/issues/61
