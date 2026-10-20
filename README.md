# Coding agent plugin

Shared instructions for coding agents, maintained in [jeromeetienne/coding_agent_plugin](https://github.com/jeromeetienne/coding_agent_plugin). A skill is a folder with a `SKILL.md` file that tells a coding agent how to carry out a task.

The repository contains four skills that other projects can install independently of Heidrun. A plugin manifest has not been added yet; the commands below install the individual skills.

## Available skills

| Skill | Purpose |
| --- | --- |
| [issue_fix_workflow](skills/issue_fix_workflow/SKILL.md) | Fix one issue through Issue Fix Setup, Issue Fix Implementation, Issue Fix Review, and Issue Fix Completion, using a temporary worktree. |
| [bug_triage_workflow](skills/bug_triage_workflow/SKILL.md) | Collect and classify open issues, report recommendations, and close an issue only when the developer names its number. |
| [git_cleanup_adviser](skills/git_cleanup_adviser/SKILL.md) | Review Git branches and worktrees and advise which appear safe to remove, without removing anything. |
| [context_md_system](skills/context_md_system/SKILL.md) | Read, create, update, and verify the `CONTEXT.md` files that describe the purpose, exports, and rules of folders. |

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

Install all four skills for Claude Code and Codex without prompts:

```bash
npx skills add jeromeetienne/coding_agent_plugin --skill '*' --agent claude-code --agent codex --yes
```

Install only one skill:

```bash
npx skills add jeromeetienne/coding_agent_plugin --skill issue_fix_workflow
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

Read a skill's `SKILL.md` before using or changing the skill. The Issue Fix Workflow reads repository-specific commands and branch choices from the receiving project's `AGENTS.md`; configure those values before using the workflow.

The repository contains Markdown instructions. There is no `package.json`, dependency installation, build, or test suite for this repository.

## Relationship with Heidrun

The skills were extracted from Heidrun's temporary `packages/experiments/coding_agent_plugin` folder with the Git history of that folder. Heidrun's original skills remain in `.agents/skills` of the Heidrun repository. The copies in this repository are not synchronized automatically. While this arrangement remains, make shared skill changes in Heidrun's original skills first, then update the copies here.

Adding this repository to Heidrun as a Git submodule is a separate migration step. The agreed destination is `./submodules/coding_agent_plugin`; publishing this repository does not create that submodule.

The following Heidrun issues describe the extraction and the earlier work:

- https://github.com/heidrun-org/heidrun/issues/708
- https://github.com/heidrun-org/heidrun/issues/682
- https://github.com/heidrun-org/heidrun/issues/658
