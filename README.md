# Coding agent skills

Shared instructions for coding agents, maintained in [jeromeetienne/coding_agent_plugin](https://github.com/jeromeetienne/coding_agent_plugin). A skill is a folder with a `SKILL.md` file that tells a coding agent how to carry out a task.

The repository contains seven skills, including a first draft of Jérôme Étienne’s Rust coding style. A plugin manifest has not been added yet; the commands below install the individual skills.

## Available skills

| Skill | Purpose |
| --- | --- |
| [issue_fix_workflow](skills/issue_fix_workflow/SKILL.md) | Fix one issue through Issue Fix Setup, Issue Fix Implementation, Issue Fix Review, and Issue Fix Completion, using a temporary worktree. |
| [issue_creation](skills/issue_creation/SKILL.md) | Create an issue on GitHub with the `gh` command or on GitLab with the `glab` command, attach images to the issue, and write the text of the issue with links to files and to other issues. |
| [bug_triage_workflow](skills/bug_triage_workflow/SKILL.md) | Organize the bug issue list and recommend the next bug to fix to improve software stability, with evidence for each priority. This workflow is a work in progress. |
| [git_cleanup_adviser](skills/git_cleanup_adviser/SKILL.md) | Review Git branches and worktrees and advise which appear safe to remove, without removing anything. |
| [context_md_system](skills/context_md_system/SKILL.md) | Read, create, update, and verify the `CONTEXT.md` files that describe the purpose, exports, and rules of folders. |
| [jerome-typescript-javascript-style](skills/jerome-typescript-javascript-style/SKILL.md) | Apply Jérôme Étienne’s personal TypeScript and JavaScript coding style, including naming, formatting, documentation, and code organization. |
| [jerome-rust-style](skills/jerome-rust-style/SKILL.md) | Apply the first draft of Jérôme Étienne’s personal Rust coding style, containing clearly transferable rules and adaptations he explicitly approves. |

The `jerome-typescript-javascript-style` skill records Jérôme Étienne’s own way of coding. These are his personal preferences, not a general TypeScript or JavaScript standard. The skill includes the rules from his Claude Code user configuration.

The `jerome-rust-style` skill is a first draft derived conservatively from that style. Its [adaptation review](skills/jerome-rust-style/references/adaptation-review.md) records the retained rules and the questions awaiting Jérôme’s decisions. The draft is not a complete Rust style.

## Install the skills

Use the [skills command line tool](https://github.com/vercel-labs/skills). The command `npx` comes with Node.js. Run the commands from the project that should receive the skills.

Choose which skills and coding agents to install for:

```bash
npx skills add jeromeetienne/coding_agent_plugin
```

List the available skills without installing:

```bash
npx skills add jeromeetienne/coding_agent_plugin --list
```

Install all available skills, including the Rust draft, for Claude Code and Codex without prompts:

```bash
npx skills add jeromeetienne/coding_agent_plugin --skill '*' --agent claude-code --agent codex --yes
```

Install only one skill:

```bash
npx skills add jeromeetienne/coding_agent_plugin --skill issue_fix_workflow
```

Install Jérôme Étienne’s personal coding style:

```bash
npx skills add jeromeetienne/coding_agent_plugin --skill jerome-typescript-javascript-style
```

Installation applies to the current project by default. Add `--global` to install for the user across projects, or `--copy` to copy files instead of creating symbolic links. See the [installation reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md#skills-add) for requirements and other options.

## Work with a local copy

Clone this repository:

```bash
git clone https://github.com/jeromeetienne/coding_agent_plugin.git
```

From the project that should receive the skills, give the path to the clone:

```bash
npx skills add /path/to/coding_agent_plugin
```

To install only the Rust draft from a local copy containing the draft:

```bash
npx skills add /path/to/coding_agent_plugin --skill jerome-rust-style
```

After the Rust skill is published, replace the local path with `jeromeetienne/coding_agent_plugin` to install the published version. Creating the draft does not install or enable the skill in receiving projects.

Read a skill's `SKILL.md` before using or changing the skill. The Issue Fix Workflow reads repository-specific commands and branch choices from the receiving project's `AGENTS.md`; configure those values before using the workflow.

The repository contains Markdown instructions. There is no `package.json`, dependency installation, build, or test suite for this repository.

## Maintain the skills

This repository is independent and is the authoritative location for all skills. Make future skill changes directly in this repository. Projects that use the skills, including Heidrun, receive changes from this repository and do not control how the skills are maintained.

Copies installed in other projects and user configurations are not synchronized automatically. Updating those copies is a separate action.

The `jerome-typescript-javascript-style` reference contains Jérôme Étienne’s personal rules, including changes he explicitly requests. Do not rewrite those rules as part of general documentation maintenance; changes to the rules require his explicit instructions.

## History

The four workflow skills were extracted from Heidrun with the Git history of their folder. The personal coding style skill was added from Jérôme Étienne’s Claude Code user configuration. The `issue_creation` skill was added from the section "GitHub and GitLab" of the file `AGENTS.md` of Heidrun.

The following issues describe the extraction and the earlier work:

- https://github.com/heidrun-org/heidrun/issues/708
- https://github.com/heidrun-org/heidrun/issues/682
- https://github.com/heidrun-org/heidrun/issues/658

## License

[MIT](LICENSE) © 2026 Jérôme Étienne.
