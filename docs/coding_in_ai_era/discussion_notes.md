# Coding in AI era: discussion notes

- Created: 14 November 2026
- Last updated: 14 November 2026
- Status: Open discussion notes
- Related framing: [Agent instructions](../../AGENTS.md)

## Purpose

Jérôme Étienne is developing an approach to organizing coding in the AI era. Code production has changed dramatically, and humans need a way to remain in control of the product and its implementation. Accepting pull requests was a major starting point, but the approach extends beyond pull request review.

## Capture, organize, and communicate

The current activity is capturing Jérôme Étienne's thinking. Preserve the ideas, reasons, requirements, and open questions, distinguishing Jérôme Étienne's decisions from assistant suggestions. Organize the explanation into human-readable documentation. Public blog posts can then communicate the approach using that established understanding; blog post planning and production are maintained in Heidrun Business.

The discussion aims to identify the requirements the approach must satisfy, then examine how the skills in this repository meet those requirements. Record gaps in both the requirements and the existing system. The launcher reordering simulation has been set aside; the discussion continues through Jérôme Étienne explaining the approach directly.

## Relationship to pull request review

The [pull request discussion](pull_request/discussion_notes.md) explores product intent, code verification, repository rules, and human approval to merge. The [pull request requirements](pull_request/requirements.md) have stable identifiers so each requirement can be discussed individually.

## Explicit repository rules and their framework

Jérôme Étienne identifies The Rules of the Repo as another part of the review approach. Repository requirements must be clearly expressed and formalized inside the repository so coding agents can find, understand, and apply the requirements. Expectations left unstated cannot provide a dependable basis for automated review.

The Rules of the Repo provides the common entry point: a rules list identifies which rule skills apply to a change and supplies the configuration for each rule skill. The framework distinguishes static rules from living rules, including rules whose changes require human approval. See [The Rules of the Repo](../../skills/rules_of_the_repo/SKILL.md).

Examples raised by Jérôme Étienne include maintaining Symbiospec alongside authorized product changes, following Repo Folders Constraints when placing code or creating packages, and following the repository's coding style. Repo Folders Constraints is one rule within the framework, rather than a competing framework. See [Repo Folders Constraints](../../skills/repo_folders_constraints/SKILL.md).

The assistant suggested additional possible rule areas: dependencies, security, verification evidence, compatibility, database changes, and documentation. These examples are possibilities for discussion, not newly adopted rules for this repository.

Applied to pull request review, the approach adds a check that the change follows the applicable repository rules. A useful review report would identify the applicable rules, evidence of compliance, violations, and checks that could not be completed. Writing down a rule does not by itself prove that an agent enforced the rule correctly.


## The meaning of the name Symbiospec

Jérôme Étienne defines the symbiotic relationship as collaboration between humans and AI toward one shared goal. The preferred introduction is “the shared product specification for humans and AI”. The [Symbiospec skill overview](../../skills/symbio_spec/README.md) now explains that meaning.

## Independent skills that cooperate

Jérôme Étienne describes the repository as a collection of skills that should be usable independently unless a dependency is explicitly stated. The collection supports a broader approach to coding in the AI era without requiring every project to adopt every skill.

The repository name is `coding_agent_plugins`. Jérôme Étienne explains that “plugins” came from the idea of bundling skills. Whether the collection and the broader approach should have another name remains an open question. No rename has been decided.

| Skill | Responsibility in the approach |
| --- | --- |
| [CONTEXT.md system](../../skills/context_md_system/README.md) | Maintain folder context; independently usable. |
| [Docs folder system](../../skills/docs_folder_system/README.md) | Organize documentation; independently usable. |
| [Git Cleanup Review](../../skills/git_cleanup_review/README.md) | Review worktrees and branches and recommend cleanup; independently usable. |
| [Issue Creation](../../skills/issue_creation/README.md) | Write issues. |
| [Issue Fix Workflow](../../skills/issue_fix_workflow/README.md) | Carry one issue through implementation, review, and completion. |
| [Issue Batch Workflow](../../skills/issue_batch_workflow/README.md) | Coordinate a parent issue and related sub-issues; related to Issue Fix Workflow rather than wholly independent of the single-issue process. |
| [TypeScript and JavaScript style](../../skills/jerome-typescript-javascript-style/README.md) | Express the adopted TypeScript and JavaScript coding preferences. |
| [Rust style](../../skills/jerome-rust-style/README.md) | Express the adopted Rust coding preferences. |
| [Keep a Changelog Workflow](../../skills/keep-a-changelog-workflow/README.md) | Produce and maintain changelogs as a utility. |
| [Repo Folders Constraints](../../skills/repo_folders_constraints/README.md) | Define folder and package responsibilities, code placement, and allowed directions of dependencies between packages. |
| [The Rules of the Repo](../../skills/rules_of_the_repo/README.md) | Organize how repository rules are found, applied, and maintained. |
| [Symbiospec](../../skills/symbio_spec/README.md) | Describe the product through a shared specification for humans and AI. |
| [symbio_spec_to_docs](../../skills/symbio_spec_to_docs/README.md) | Produce audience documentation from approved Symbiospec and implementation evidence. |
| [symbio_spec_to_ux](../../skills/symbio_spec_to_ux/README.md) | Propose user interface structure from approved Symbiospec for human review; currently a draft not tested on a real project. |

Writing pull request descriptions and reviewing or accepting pull requests are additional skill needs identified during the discussion. Those skills have not been implemented; their requirements are collected in the [pull request requirements](pull_request/requirements.md).

The aim is to automate as much of the work as practical while preserving explicit human product decisions and human approval before merging. Independence describes the intended organization of the collection; each skill's actual prerequisites still need to be read rather than assuming every combination has no dependencies.

## Experience behind symbio_spec_to_ux

Jérôme Étienne distinguishes the purpose and prior use of the approach from the evaluation of the reusable skill. The current discussion describes purpose and intent.

Jérôme Étienne reports applying the approach twice: to the Project Management Plugin in Heidrun Notebook and to Heidrun Store. The approach used object-oriented user experience design to derive user interface structure and navigation from product specifications. Jérôme Étienne considers the resulting user interface structure and navigation good. These are experiences reported by Jérôme Étienne during this discussion; no independent investigation of those implementations was performed here.

The reusable `symbio_spec_to_ux` skill was generated from those experiences. The reusable skill remains a draft because Jérôme Étienne has not yet used the reusable skill itself. The draft status does not mean that the underlying approach has never been applied.
