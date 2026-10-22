# Directory Context: `/`

## Purpose
The standalone repository for shared workflow skills and Jérôme Étienne’s personal coding styles that other projects can install.

## Key Exports & Entry Points
- `skills/`: the skill folders, each with instructions for the coding agent in `SKILL.md` and an overview of its purpose for people in `README.md`.
- [README.md](README.md): installation commands, receiving-project configuration, and skill maintenance.

## Rules
- The repository contains Markdown instructions and has no `package.json`, build, or test suite.
- The repository has no plugin manifest; installation currently installs individual skills.
- This independent repository is the authoritative location for all skills; make future skill changes here, as [README.md](README.md#maintain-the-skills) describes.
- Projects and user configurations that receive the skills are not synchronized automatically.
- The `jerome-typescript-javascript-style` skill expresses Jérôme Étienne’s personal preferences and includes its full rules without depending on his user configuration.
- The `jerome-rust-style` skill is a first draft containing clearly transferable rules and adaptations explicitly approved by Jérôme; its bundled adaptation review records uncertain rules separately from the active Rust rules.
- Repository-specific commands and branch choices for the Issue Fix Workflow belong in the receiving project's `AGENTS.md`.

## Background
- https://github.com/heidrun-org/heidrun/issues/708
- https://github.com/heidrun-org/heidrun/issues/682
- https://github.com/heidrun-org/heidrun/issues/658
