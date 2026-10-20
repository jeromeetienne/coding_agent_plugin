# Directory Context: `/`

## Purpose
The standalone repository for four shared coding agent skills that other projects can install independently of Heidrun.

## Key Exports & Entry Points
- `skills/`: the four skill folders, each with instructions in `SKILL.md`.
- [README.md](README.md): installation commands, receiving-project configuration, and the relationship with Heidrun.

## Rules
- The repository contains Markdown instructions and has no `package.json`, build, or test suite.
- The repository has no plugin manifest; installation currently installs individual skills.
- The copies in `skills/` are not synchronized automatically with Heidrun's original skills; follow the maintenance instructions in [README.md](README.md#relationship-with-heidrun).
- Repository-specific commands and branch choices for the Issue Fix Workflow belong in the receiving project's `AGENTS.md`.

## Background
- https://github.com/heidrun-org/heidrun/issues/708
- https://github.com/heidrun-org/heidrun/issues/682
- https://github.com/heidrun-org/heidrun/issues/658
