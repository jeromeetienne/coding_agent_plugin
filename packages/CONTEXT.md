# Directory Context: `/packages`

## Purpose

Hold the executable tools maintained alongside the shared coding-agent skills.

## Key Exports & Entry Points

- `rename_agent_project/`: the project conversation migration tool; see [CONTEXT.md](rename_agent_project/CONTEXT.md).

## Rules

- Each tool owns its source files, dependencies, tests, and package instructions.
- The root pnpm workspace manages installation and the shared dependency lockfile.

## Background

- [Repository context](../CONTEXT.md)
