# How the skills work together

- Created: 9 November 2026
- Last updated: 14 November 2026
- Status: Maintained guide for people
- Related framing: [Documentation conventions](../contributing/maintaining_skills.md)
- Related rules: [Docs folder system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [#36](https://github.com/jeromeetienne/coding_agent_plugin/issues/36)

## Choose a starting point

Install the skills needed for the work rather than assuming the whole collection must be installed. Installation supplies instructions; receiving-project configuration supplies branch names, commands, paths, and project decisions. A published skill is not automatically enabled for this repository.

| Goal | Start with | Add when needed |
| --- | --- | --- |
| Record a problem or request | [Issue Creation](../../skills/issue_creation/README.md) | Issue Fix Workflow when ready to implement |
| Fix one issue with human review | [Issue Fix Workflow](../../skills/issue_fix_workflow/README.md) | Applicable repository rule skills |
| Implement an agreed group of related issues | [Issue Batch Workflow](../../skills/issue_batch_workflow/README.md) | Required Issue Fix Workflow and Issue Creation |
| Apply the right repository rules before a change | [The Rules of the Repo](../../skills/rules_of_the_repo/README.md) | The individual rule skills selected in the project's rules list |
| Record and maintain approved product intent | [Symbiospec](../../skills/symbio_spec/README.md) | Symbiospec to documentation when approved specifications and implementation are available |
| Write release notes from repository evidence | [Keep a Changelog Workflow](../../skills/keep-a-changelog-workflow/README.md) | Existing pull requests and version tags |
| Identify redundant worktrees and branches | [Git Cleanup Review](../../skills/git_cleanup_review/README.md) | A separate authorized removal task after the review |

## Required dependencies and optional combinations

The following diagram shows instruction dependencies and configuration flow. Arrows labelled “optional” are useful combinations, not automatic calls or required installations.

```text
Issue Batch Workflow
  +-- requires Issue Fix Workflow -- reads project workflow values
  +-- requires Issue Creation

The Rules of the Repo -- reads project's rules list
  +-- selects applicable rule skills and supplies their configuration
      +-- Repo Folders Constraints
      +-- Docs folder system
      +-- CONTEXT.md system
      +-- personal coding style (when adopted)
      +-- Symbiospec (when adopted)

Symbiospec to documentation
  +-- requires Symbiospec and the project's Symbiospec data
  +-- requires explicit documentation-set configuration

Symbiospec -- optional --> Issue Batch Workflow for implementation issues
Issue Fix Workflow -- optional --> Keep a Changelog Workflow
Completed development -- optional --> Git Cleanup Review
```

[Docs folder agents rules system](../../skills/docs_folder_agents_rules_system/README.md) also requires Docs folder system, but is obsolete and retained for existing projects. New adoption should use Symbiospec for the responsibilities that supersede the obsolete system. [Jérôme Étienne’s Rust coding style](../../skills/jerome-rust-style/README.md) is ready for use; adopting the style does not decide the possible extensions in the adaptation review.

The Rules of the Repo does not make every published skill mandatory. Only the applicable entries in the receiving project's rules list are selected. Individual rule skills can work without The Rules of the Repo when their required configuration comes from another supported caller. Neither Keep a Changelog Workflow nor Git Cleanup Review is automatically performed after every fix.

## Example: one reviewed issue fix

Suppose a developer wants an existing command to explain a missing input more clearly.

1. Use Issue Creation to record the current result, the expected message, and a way to reproduce the problem. Link relevant files and related issues.
2. Configure Issue Fix Workflow in the receiving project with its target branch, worktree command and folder, launch command, issue tracker commands, and chat rename method. Ask the coding agent to fix the issue.
3. Issue Fix Setup reads the issue and discussion and creates a temporary worktree. The main working folder remains separate from the implementation.
4. Before changing files, use The Rules of the Repo when adopted. Repo Folders Constraints checks where the change belongs; CONTEXT.md system supplies folder notes; an adopted personal coding style applies to matching source files. Docs folder system applies if documentation changes. These checks apply throughout the work, not just once at setup.
5. Issue Fix Implementation changes the command and relevant tests and documentation. If Symbiospec is adopted, update the affected approved specification within the authorized product decision; obtain approval for additional product meaning before adopting it.
6. Issue Fix Review provides the launch command and what to inspect. The developer reviews the result and confirms that the result is good before Issue Fix Completion commits, creates and merges the pull request, and closes the issue.
7. When a release is requested, Keep a Changelog Workflow can describe the merged change using pull request evidence and the chosen version tags. Creating tags or publishing a release remains a separately instructed action.
8. Git Cleanup Review can later assess redundant worktrees and branches. The report is advice; removal needs a separate request naming the items.

## Example: a batch of related changes

Suppose an approved product change needs a command change, a settings change, and documentation updates. Record one parent issue and the separate implementation issues, with each issue linked to the applicable approved decisions.

Issue Batch Workflow investigates the group before requesting the developer's attention. The coding agent groups changes by shared files or review area, orders dependencies, records the plan, and asks all initial questions together. The developer's answers establish the batch decisions.

After that initial decision stage, independent groups run in parallel with helper agents and separate temporary worktrees. Dependent groups start after their prerequisites merge. The coding agent checks each group and merges passing groups without another routine developer review. A failing group is corrected or retained with its worktree and reported; a failure is not treated as completion. The parent closes only when all sub-issues are closed.

This differs from Issue Fix Workflow's per-issue human review. Choose the workflow deliberately: a parent issue does not remove approval boundaries for unresolved product decisions.

## Example: documentation from approved product information

Use Symbiospec to establish approved definitions and behavior in the receiving project. Existing implementation is evidence, not automatic approval. Add a documentation-set configuration with an audience, explicit source and output paths, included topics, and a review-record location.

Ask [Symbiospec to documentation](../../skills/symbio_spec_to_docs/README.md) to update that set using the explicit configuration path. The coding agent documents only features supported by both approved specification and implementation evidence. Approved features not yet implemented and implemented features missing approval belong in the separate review record.

Corrections to generated documentation go through the approved specification or documentation configuration, followed by regeneration. Report source inspection, test execution, live application exercises, documentation builds, and publication separately. Generating pages does not by itself publish a website.

## Configure the receiving project

Read each selected skill's configuration section before installation is treated as complete. Keep project-specific values outside installed skill folders. For workflows, configure the required section in the project's agent instructions. For rule skills, supply the configuration path through the rules list or a documented standalone invocation.

Use the [collection overview](../../README.md) for readiness and the reference below for required inputs. Make shared skill changes in this authoritative repository. Installed copies in receiving projects are updated separately; a merge here does not synchronize those copies.

## Dependencies and relationships

Required inputs below come from current instructions. Optional relationships are not automatic installation dependencies. Receiving-project rules still apply.

| Skill | Required skills, inputs or capabilities | Optional relationships and authority limits |
| --- | --- | --- |
| `rules_of_the_repo` | Rules-list path in AGENTS.md; applicable rule skills and their configurations. | Individual rule skills can also work without rules_of_the_repo. |
| `repo_folders_constraints` | Caller-supplied path to human-owned folder/package rules. | Optional rules_of_the_repo caller; complements context_md_system, with human-owned rules taking precedence. |
| `symbio_spec` | Project evidence and human decisions; bundled format and workflow references. | docs_folder_system when required by the receiving project; implementation sub-issues feed issue_batch_workflow. |
| `symbio_spec_to_docs` | Installed symbio_spec, project Symbiospec data, approved sources, implementation evidence and explicitly supplied complete configuration per set. | rules_of_the_repo is optional; direct request or AGENTS.md can supply configuration. |
| `keep-a-changelog-workflow` | Git history, version tags and pull request evidence; established release dates or authorized date convention; write access for edits. | No companion skill or language/build system required; gh can provide GitHub pull request access. |
| `issue_fix_workflow` | Complete Issue Fix Workflow values in receiving AGENTS.md; Git worktrees and configured issue-tracker/check capabilities. | issue_creation applies to issue comments; relevant project rules/specifications apply. Developer acceptance precedes completion. |
| `issue_batch_workflow` | issue_fix_workflow and issue_creation; same configured values; parent/sub-issues, helper agents and worktrees. | Project specifications such as symbio_spec when applicable. Recorded initial decisions govern subsequent batch completion. |
| `issue_creation` | Installed, authenticated gh or glab and target-project access; attachment files when used. | No configuration file or companion skill required; called by issue workflows and other authorized issue-writing tasks. |
| `git_cleanup_review` | Readable Git history, branches/worktrees, repository instructions and identified destination; report missing evidence. | Remote access supports live checks. No configuration file or companion skill; removal needs a separate request. |
| `context_md_system` | Repository files and parent context files; no configuration file required. | Complements repo_folders_constraints; can be registered in rules_of_the_repo. |
| `docs_folder_system` | Supplied documentation-folder and metadata-exception values through configuration or AGENTS.md. | Independent or called through rules_of_the_repo; other documentation skills follow it when required. |
| `jerome-typescript-javascript-style` | Bundled style reference; project/request adopting the personal style; no configuration file. | Related source for Rust adaptation; Rust skill is not required. Preference changes need explicit instructions. |
| `jerome-rust-style` | Bundled active Rust rules; adaptation review when extending the style; no configuration file. | Self-contained adaptation of TypeScript/JavaScript preferences. Uncertain adaptations need Jérôme Étienne’s decision. |
| `docs_folder_agents_rules_system` | docs_folder_system; supplied agent-rules folder, glossary folder, size maximum and size-test command. | Superseded by symbio_spec; retained for existing projects. Migration is a separate authorized task. |
