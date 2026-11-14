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

