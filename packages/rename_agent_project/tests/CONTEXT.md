# Directory Context: `/packages/rename_agent_project/tests`

## Purpose

Verify folder renames, conversation migration, manual client closure and shared server preservation, independent execution, and recovery with disposable data.

## Key Exports & Entry Points

- Command from the package folder: `pnpm test`.
- `pnpm synthetic --evidence <absolute-new-directory>` runs the full representative fixture; `--profile smoke` runs a reduced fixture.
- `synthetic_oracle.ts` verifies data independently and imports no rename implementation; explicit project roots allow reuse of a completed large fixture.
- `pnpm synthetic:faults --evidence <absolute-new-directory>` runs one-shot failures in separate workers; fault injection stays in tests.
- Tests have no public package exports.

## Rules

- Tests create their own synthetic data and temporary application stores.
- Tests do not migrate actual user project folders or existing user conversations.
- Command-line tests execute src/cli.ts with explicit synthetic storage paths.
- Unit test data is removed after each test; the representative runner preserves failed fixtures and evidence for recovery.

## Background

- https://github.com/jeromeetienne/coding_agent_plugin/issues/64
