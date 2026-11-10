# Directory Context: `/packages/rename_agent_project/src/tests`

## Purpose

Verify migration isolation, recoverable storage changes, and command-line validation with disposable data.

## Key Exports & Entry Points

- Command from the package folder: `pnpm test`.
- Tests have no public package exports.

## Rules

- Tests create their own synthetic data and temporary application stores.
- Tests do not migrate actual user project folders or existing user conversations.
- Command-line tests execute the parent folder's cli.ts with explicit synthetic storage paths.
- Temporary test data is removed after each test.

## Background

- https://github.com/jeromeetienne/coding_agent_plugin/issues/64
