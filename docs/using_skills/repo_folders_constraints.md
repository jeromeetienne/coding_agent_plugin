# Repo Folders Constraints

- Created: 9 November 2026
- Last updated: 14 November 2026
- Status: Explanation and adoption guide for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related rules: [Docs folder system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 26](https://github.com/jeromeetienne/coding_agent_plugin/issues/26), [Issue 41](https://github.com/jeromeetienne/coding_agent_plugin/issues/41)

## Purpose and ownership

Repo Folders Constraints records the responsibilities and boundaries of repository folders and packages in one human-owned Markdown rules file. Written boundaries help a human and a coding agent decide where work belongs and prevent a small file or dependency change from silently changing the organization of the repository.

The human owns and reviews the rules file. The coding agent reads and obeys the rules file, checks proposed changes against the rules file, and proposes rule changes for approval. Code that already violates a rule does not automatically authorize changing the rule.

The [repo_folders_constraints README](../../skills/repo_folders_constraints/README.md) gives installation and a short adoption example. The [instructions](../../skills/repo_folders_constraints/SKILL.md) are authoritative for the exact procedure. This guide explains existing behaviour; the examples do not create folder rules for this repository.

## What the rules file records

The rules file has one table for packages and one table for other folders. Each row represents one package or folder, with paths relative to the repository root.

| Column | Meaning |
| --- | --- |
| Folder | The repository-relative path. |
| Does | The responsibility of the folder or package. |
| Never does | Content or behaviour that must stay outside the folder or package. |
| May import | Other packages permitted as imports or dependencies; only in the packages table. Use `no other package` when none are permitted. |
| Language and technologies | Required language and technologies. |
| Workflow | How content is changed, including a required skill or the command that generates content. |

Keep cells short enough for human review. Use `not decided yet` for an undecided value and `—` when a column does not apply. Reasons and history belong in issues and context notes rather than long table cells.

Here is a complete illustrative rules file, stored at `.agents/repo_folders_constraints.md` in a receiving project:

```markdown
# Repo Folders Constraints

## Packages

| Folder | Does | Never does | May import | Language and technologies | Workflow |
| --- | --- | --- | --- | --- | --- |
| packages/core | Calculate totals. | Read files or call services. | no other package | TypeScript | Change with relevant tests. |
| packages/website | Present totals. | Reimplement calculations. | packages/core | TypeScript, Vue | Review visible changes. |

## Other folders

| Folder | Does | Never does | Language and technologies | Workflow |
| --- | --- | --- | --- | --- |
| docs | Explain installation and use. | Hold implementation files. | Markdown | Follow docs_folder_system. |
| generated | Hold generated reference files. | Hold manually edited files. | Markdown | Run pnpm generate-reference. |
| plugins | not decided yet | not decided yet | not decided yet | not decided yet |
```

These package and folder names are example inputs. The example assumes the receiving project already defines `pnpm generate-reference`; this repository supplies no such command. A receiving project must use its real generation command when adopting the generated-folder rule.

## Standalone setup

Install `repo_folders_constraints` as described in the [README](../../skills/repo_folders_constraints/README.md#install). No other skill is inherently required. Install additional skills when the chosen rules require those skills; the example `docs` workflow requires `docs_folder_system`.

For a project without The Rules of the Repo, place this section in `AGENTS.md` after the human agrees to the path and rules:

```markdown
## Repo Folders Constraints

Every folder and every package of this repository follows the skill [repo_folders_constraints](.agents/skills/repo_folders_constraints/SKILL.md). Read the skill before you create, move, rename, or delete a folder or a package, and before you add an import between packages.

- Rules file: .agents/repo_folders_constraints.md
```

Create the human-approved rules file at that path, using the two-table form above. If adopting the example documentation workflow, also configure `docs_folder_system` using its [standalone example](../../skills/docs_folder_system/README.md#configuration). The path is supplied explicitly; the skill does not search for or guess the rules file.

## Setup through The Rules of the Repo

Start with the [complete coordinated documentation example](../../skills/rules_of_the_repo/README.md#configuration), which supplies `AGENTS.md`, a rules list and Docs folder system configuration. Install the additional selected skill:

```bash
npx skills add jeromeetienne/coding_agent_plugin --skill repo_folders_constraints
```

Add this row to `.agents/rules_of_the_repo/rules_list.md`. Links below are relative to that example rules-list file:

```markdown
| [repo_folders_constraints](../skills/repo_folders_constraints/SKILL.md) | Before folder/package changes, new files, package imports or dependencies, technology changes, or changes governed by a folder workflow. | Living rule with human approval | [config.md](config/repo_folders_constraints/config.md) |
```

For this coordinated setup, put the complete two-table rules file above at `.agents/rules_of_the_repo/config/repo_folders_constraints/config.md` instead of the standalone path. The configuration file is the human-owned rules file itself; no second wrapper file is needed. The Rules of the Repo supplies that path to `repo_folders_constraints`.

The receiving project now has two applicable rows for adding a guide: Repo Folders Constraints checks placement and workflow, while Docs folder system checks metadata and navigation. For general rule selection, types and configuration ownership, read [The Rules of the Repo](rules_of_the_repo.md).

## When the coding agent checks the rules

Before creating, moving, renaming or deleting a folder or package, the coding agent reads the rules for every affected folder and package. The same check applies before adding a file, adding an import or dependency between packages, changing a required language or technology, or changing a folder whose content has a prescribed workflow.

For example, adding `docs/setup.md` fits the sample docs responsibility, but adding a calculation implementation in `docs` conflicts with the sample prohibition. An import from `packages/website` to `packages/core` is permitted; an import in the opposite direction is not permitted. A manual change in `generated` conflicts with the generation workflow. Replacing Vue with another technology requires reviewing the website technology rule.

The coding agent first corrects a proposed change so the change obeys the existing rules. When the requested work cannot obey the existing rules, the coding agent proposes a rule change instead of silently breaking the rule.

## Missing inputs and undecided rules

| Situation | Expected response |
| --- | --- |
| No caller supplies the rules-file path. | Stop folder/package changes, report “The Repo Folders Constraints are not configured in this repository.”, show the template and ask for the path. Never infer a path. |
| An applicable configuration file or value is missing when called through The Rules of the Repo. | Stop the change and identify the missing configuration or value under The Rules of the Repo. |
| A folder or package has no rule. | Propose the missing rule for human review before making the change that needs the rule. |
| A required decision says `not decided yet`. | Propose the needed decision; for example, the first plugin cannot establish its own rules without review. |
| A rule is wrong, disagrees with code, or conflicts with requested work. | Propose the current and intended rules for review; existing code does not decide the rule. |

## Example of human review

Request: “Add a live price lookup in `packages/core`.” The current rules forbid service calls from `packages/core`. The coding agent first considers a solution within the existing boundary, such as having the caller supply prices. If service access from `packages/core` is required, the coding agent presents:

| Current rule | Proposed rule |
| --- | --- |
| packages/core never reads files or calls services. | packages/core never reads files; packages/core may call the price service. |

The coding agent explains that the proposed change makes calculations depend on service access and requires relevant failure handling and tests. The human chooses:

- **Approve:** write the approved rule, then continue the authorized work.
- **Cancel:** preserve the existing rule and do not make the conflicting change.
- **Refine:** discuss an alternative, such as a separate service-access package, then present a revised proposal for review.

Review the resulting rules-file change alongside the implementation. A new package proposed during refinement also needs a package row; refinement alone is not approval of the new package. The same current/proposed review applies when adding a missing folder rule or resolving `not decided yet`.

## Relationship to CONTEXT.md notes

Repo Folders Constraints states human-owned decisions. The [CONTEXT.md system](../../skills/context_md_system/README.md) maintains short notes for coding agents about folder purpose, exports and boundaries. The coding agent can update those notes without human approval, but note maintenance does not authorize changing human-owned decisions.

When a context file says `packages/core` may call services while the rules file forbids service calls, the rules file takes precedence. The coding agent corrects the context file. A desired change to the human-owned boundary requires the proposal and approval described above. History and reasons can remain in context notes and linked issues while the rules table stays concise.

## Review and limits

Expected outcomes are a change checked against all affected rows, an explicit missing-input report, or a rule-change proposal. Review responsibility, prohibitions, dependencies, technologies and workflow together. Installation alone supplies no project rules, and the skill does not prove application correctness, run a deployment or publish documentation.

- [Repo Folders Constraints instructions](../../skills/repo_folders_constraints/SKILL.md): exact rules-file form and approval procedure.
- [The Rules of the Repo](rules_of_the_repo.md): coordination and rule types.
- [Docs folder system](../../skills/docs_folder_system/README.md): document form, configuration and navigation.
