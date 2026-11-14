# Coding agent skills

Reusable instructions for coding agents, maintained in [jeromeetienne/coding_agent_plugin](https://github.com/jeromeetienne/coding_agent_plugin). A skill is a folder containing a SKILL.md instruction file and a README explaining adoption and use.

Read the **[documentation website](https://jeromeetienne.github.io/coding_agent_plugin/)** or the [documentation overview](docs/README.md). The collection contains 14 skills: thirteen current skills and one obsolete skill retained for existing projects. Installation currently selects individual skills; there is no plugin manifest.

## Choose skills

Start with [How the skills work together](docs/using_skills/skills_together.md) for required dependencies, optional combinations, and complete examples. Each link below opens the skill’s introduction for people; exact coding-agent instructions are linked from that introduction.

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

## Configure the installed skills

Installing skills adds their instructions. Before using the skills, copy this prompt into your coding agent in the receiving repository:

```text
Configure all skills newly installed in this repository.

Read each installed skill’s SKILL.md and the repository’s existing instructions. Identify required companion skills, configuration files, and repository-specific values.

Inspect the repository and propose suitable configuration values. Reuse existing conventions. Ask me together about any missing choices and any values that require my approval.

After the required approvals, create the configuration files and update AGENTS.md so future coding agents know when and how to use each skill. Keep repository-specific configuration outside the installed skill folders.

Verify that required companion skills are available, configuration is complete, and file links resolve. Report which skills are ready to use and anything that remains unfinished.
```

Read [Install and configure the skills](docs/using_skills/installing_skills.md) for prerequisites, companion skills, local copies, and installation options.

## Maintain the skills

This repository is the authoritative source. Shared skill changes belong here; installed copies in other projects are updated separately. Read [Maintain the shared skills](docs/contributing/maintaining_skills.md) for ownership, history, and documentation updates.

The [shared workflow guide](docs/using_skills/skills_together.md) explains dependencies and examples. Contributor [documentation conventions](docs/contributing/maintaining_skills.md#documentation-conventions) explain where content belongs. The [publication guide](docs/contributing/publishing.md) explains website updates and checks.

## License

[MIT](LICENSE) © 2026 Jérôme Étienne.

## Project folder rename tool

The standalone [coding_agent_project_rename](https://github.com/jeromeetienne/coding_agent_project_rename) repository owns the project folder rename tool, its installation instructions, and its recovery documentation.
