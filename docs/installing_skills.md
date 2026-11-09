# Install and configure the skills

- Created: 9 November 2026
- Last updated: 9 November 2026
- Status: Maintained installation guide
- Related framing: [Documentation structure](documentation_structure.md)
- Related rules: [Docs folder system](../skills/docs_folder_system/SKILL.md)
- Related issue: [#37](https://github.com/jeromeetienne/coding_agent_plugin/issues/37)

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

Install all available skills, including the Rust coding style, for Claude Code and Codex without prompts:

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

Installation applies to the current project by default. Add `--global` to install for the user across projects, or `--copy` to copy files instead of creating symbolic links. See the [installation reference](https://github.com/vercel-labs/../skills/blob/main/docs/commands.md#skills-add) for requirements and other options.

## Work with a local copy

Clone this repository:

```bash
git clone https://github.com/jeromeetienne/coding_agent_plugin.git
```

From the project that should receive the skills, give the path to the clone:

```bash
npx skills add /path/to/coding_agent_plugin
```

To install only the Rust coding style from a local copy containing the skill:

```bash
npx skills add /path/to/coding_agent_plugin --skill jerome-rust-style
```

Use `jeromeetienne/coding_agent_plugin` instead of the local path to install the published Rust coding style. Installing the skill does not decide possible extensions recorded in the adaptation review.

Read a skill's `SKILL.md` before using or changing the skill. The Issue Fix Workflow reads repository-specific commands and branch choices from the receiving project's `AGENTS.md`; configure those values before using the workflow. The Issue Batch Workflow uses the same values. The skill `rules_of_the_repo` reads the path of its rules list from the receiving project's `AGENTS.md`, and gives each rule skill the path of its configuration file. Without The Rules of the Repo, the skills `docs_folder_system` and `docs_folder_agents_rules_system` read their values from the receiving project's `AGENTS.md`; each skill gives the template of its values. The skill `repo_folders_constraints` reads the path of its rules file from the section "Repo Folders Constraints" of the receiving project's `AGENTS.md`, or from The Rules of the Repo.

The repository contains Markdown instructions. There is no `package.json`, dependency installation, local application build, or test suite for this repository. GitHub Pages renders the Markdown for the website as described in the [publication guide](publishing.md).

The skill [symbio_spec_to_docs](../skills/symbio_spec_to_docs/README.md) requires `symbio_spec` and the receiving project's Symbiospec data. Each documentation set has its own audience, configuration and destination folder inside the repository. Supply the configuration path through The Rules of the Repo, `AGENTS.md` or a direct request; see the [configuration reference](../skills/symbio_spec_to_docs/references/configuration.md). The skill owns the generated documentation. Corrections go through Symbiospec or configuration, followed by regeneration.


For relationships and complete development examples, read [How the skills work together](skills_together.md). Return to the [collection overview](../README.md) to choose individual skills.
