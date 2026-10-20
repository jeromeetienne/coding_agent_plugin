# Directory Context: `/`

## Purpose
The standalone repository for shared workflow skills and Jérôme Étienne’s personal TypeScript and JavaScript coding style that other projects can install independently of Heidrun.

## Key Exports & Entry Points
- `skills/`: the skill folders, each with instructions in `SKILL.md`.
- [README.md](README.md): installation commands, receiving-project configuration, and the relationship with Heidrun.

## Rules
- The repository contains Markdown instructions and has no `package.json`, build, or test suite.
- The repository has no plugin manifest; installation currently installs individual skills.
- The four workflow skills are copies of Heidrun's original skills and are not synchronized automatically; follow the maintenance instructions in [README.md](README.md#relationship-with-heidrun).
- The `jerome-typescript-javascript-style` skill expresses Jérôme Étienne’s personal preferences and includes its full rules without depending on his user configuration.
- Repository-specific commands and branch choices for the Issue Fix Workflow belong in the receiving project's `AGENTS.md`.

## Background
- https://github.com/heidrun-org/heidrun/issues/708
- https://github.com/heidrun-org/heidrun/issues/682
- https://github.com/heidrun-org/heidrun/issues/658
