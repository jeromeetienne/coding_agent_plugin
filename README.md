# Coding agent skills

Reusable instructions for coding agents, maintained in [jeromeetienne/coding_agent_plugin](https://github.com/jeromeetienne/coding_agent_plugin). A skill is a folder containing a SKILL.md instruction file and a README explaining adoption and use.

Read the **[documentation website](https://jeromeetienne.github.io/coding_agent_plugin/)** or the [documentation overview](docs/README.md). The collection contains 14 skills: thirteen current skills and one obsolete skill retained for existing projects. Installation currently selects individual skills; there is no plugin manifest.

## Choose skills

Start with [How the skills work together](docs/skills_together.md) for required dependencies, optional combinations, and complete examples. Each link below opens the skill’s introduction for people; exact coding-agent instructions are linked from that introduction.

| Skill | Purpose |
| --- | --- |
| [issue_creation](skills/issue_creation/README.md) | Record a request or problem on GitHub or GitLab. |
| [issue_fix_workflow](skills/issue_fix_workflow/README.md) | Fix one issue in a temporary worktree with human review before completion. |
| [issue_batch_workflow](skills/issue_batch_workflow/README.md) | Implement related issues in dependency order with helper agents after the initial decisions. |
| [git_cleanup_review](skills/git_cleanup_review/README.md) | Review redundant branches and worktrees and recommend a removal order; advice only. |
| [rules_of_the_repo](skills/rules_of_the_repo/README.md) | Select the repository rule skills that apply to a change and supply their configuration. |
| [repo_folders_constraints](skills/repo_folders_constraints/README.md) | Apply human-owned folder and package responsibilities, boundaries, and change rules. |
| [context_md_system](skills/context_md_system/README.md) | Maintain short folder notes describing purpose, exports, and rules. |
| [docs_folder_system](skills/docs_folder_system/README.md) | Keep documentation metadata and folder navigation consistent. |
| [symbio_spec](skills/symbio_spec/README.md) | Maintain a shared product specification with approved human intent. |
| [symbio_spec_to_ux](skills/symbio_spec_to_ux/README.md) | **Draft, untested:** propose screens and navigation from approved Symbiospec. |
| [symbio_spec_to_docs](skills/symbio_spec_to_docs/README.md) | Generate audience-specific documentation from approved Symbiospec and implementation evidence. |
| [keep-a-changelog-workflow](skills/keep-a-changelog-workflow/README.md) | Write and maintain release notes from pull request evidence and version tags. |
| [jerome-typescript-javascript-style](skills/jerome-typescript-javascript-style/README.md) | Apply Jérôme Étienne’s personal TypeScript and JavaScript preferences. |
| [jerome-rust-style](skills/jerome-rust-style/README.md) | Apply the approved rules of Jérôme Étienne’s Rust coding style; undecided adaptations remain open. |
| [docs_folder_agents_rules_system](skills/docs_folder_agents_rules_system/README.md) | **Obsolete:** retained for existing projects; Symbiospec supersedes this skill. |

The coding styles are personal preferences, not general language standards. The Rust coding style includes only clearly transferable rules and explicitly approved adaptations. The obsolete Docs folder agents rules system is not recommended for new adoption.

## Install the skills

From the project that should receive the skills, choose the skills and coding agents to install for:

```bash
npx skills add jeromeetienne/coding_agent_plugin
```

Or install one skill:

```bash
npx skills add jeromeetienne/coding_agent_plugin --skill issue_fix_workflow
```

Installation provides instructions; required receiving-project values still need configuration. Read [Install and configure the skills](docs/installing_skills.md) for prerequisites, companion skills, local copies, and installation options. Read the selected skill’s configuration section before starting work.

## Maintain the skills

This repository is the authoritative source. Shared skill changes belong here; installed copies in other projects are updated separately. Read [Maintain the shared skills](docs/maintaining_skills.md) for ownership, history, and documentation updates.

The [skill inventory](docs/skill_inventory.md) records readiness, dependencies, and coverage. The [documentation structure](docs/documentation_structure.md) explains where content belongs. The [publication guide](docs/publishing.md) explains how the same Markdown is published and checked after updates.

## License

[MIT](LICENSE) © 2026 Jérôme Étienne.

## Conversation migration script

The [rename_agent_project package](packages/rename_agent_project/README.md) migrates existing Codex and Claude Code conversations after a project folder rename. Read the [tested migration procedure](docs/conversations_after_folder_rename.md) for preparation, preview, backup, and rollback.
