# Directory Context: `/`

## Purpose
The standalone repository for shared workflow skills and Jérôme Étienne’s personal coding styles that other projects can install.

## Key Exports & Entry Points
- `skills/`: the skill folders, each with instructions for the coding agent in `SKILL.md` and an overview of its purpose for people in `README.md`.
- [README.md](README.md): installation commands, receiving-project configuration, and skill maintenance.
- `docs/`: the documentation of this repository for people, organized by the skill `docs_folder_system`; start at [docs/README.md](docs/README.md).
- [AGENTS.md](AGENTS.md): the instructions for the coding agents, with the values of the skill `docs_folder_system`.

## Rules
- Skills remain Markdown instructions and require no application build or package dependencies.
- The repository has no plugin manifest; installation currently installs individual skills.
- This independent repository is the authoritative location for all skills; make future skill changes here, as [README.md](README.md#maintain-the-skills) describes.
- Projects and user configurations that receive the skills are not synchronized automatically.
- Symbiospec format `2.0.0` stores original decisions in dated files and maintains topic summaries under the [current definition](skills/symbio_spec/references/format-v2.0.0.md); `1.0.0` remains supported without implicit migration.
- Symbiospec skills share the [format version and migration procedure](skills/symbio_spec/references/versioning.md); reusable definitions stay in the skill, and project version records stay with project specifications.
- The [symbio_spec_to_docs](skills/symbio_spec_to_docs/SKILL.md) skill requires `symbio_spec` and project Symbiospec data; project configuration and generated documentation stay outside the reusable skill.
- The `jerome-typescript-javascript-style` skill expresses Jérôme Étienne’s personal preferences and includes its full rules without depending on his user configuration.
- The `jerome-rust-style` skill is ready for use and contains clearly transferable rules and adaptations explicitly approved by Jérôme; its bundled adaptation review records uncertain rules separately from the active Rust rules.
- New documentation names its reader and the question answered; update an existing explanation when it already answers the question.
- The folder `docs` groups skill adoption, contribution, and links to independently maintained tools.
- The folder `docs` explains concepts to people and links to the files of a skill; the folder `docs` does not copy the instructions of a skill.
- Repository-specific commands and branch choices for the Issue Fix Workflow and the Issue Batch Workflow belong in the receiving project's `AGENTS.md`, in the section "Issue Fix Workflow values".

## Background
- https://github.com/jeromeetienne/coding_agent_plugin/issues/16
- https://github.com/heidrun-org/heidrun/issues/708
- https://github.com/heidrun-org/heidrun/issues/682
- https://github.com/heidrun-org/heidrun/issues/658
