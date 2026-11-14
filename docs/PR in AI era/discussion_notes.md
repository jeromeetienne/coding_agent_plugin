# Pull request review in the AI era: discussion notes

- Created: 14 November 2026
- Last updated: 14 November 2026
- Status: Open discussion notes
- Related framing: [Agent instructions](../../AGENTS.md)
- Related issue: [Issue 77](https://github.com/jeromeetienne/coding_agent_plugins/issues/77), [Issue 78](https://github.com/jeromeetienne/coding_agent_plugins/issues/78)

## The problem raised by Jérôme Étienne

A pull request proposes a change to a repository. The repository owner must decide whether the proposed change belongs in the repository and whether to accept the proposed change. Human review has traditionally helped the repository owner understand the proposed change before acceptance.

AI can increase code production beyond the amount of code a human can understand through detailed review. The discussion mentioned fifty thousand lines per person per day and ten reviewers for one person's production as illustrative estimates. These figures were not measured or verified. The argument does not depend on these particular figures: generation can exceed human review capacity.

The purpose of review remains even when reviewing every generated line becomes impractical. How should peer review preserve informed acceptance and responsibility under that constraint?

## Proposed approach discussed

The assistant proposed concentrating human review on three decisions:

1. Before implementation, review whether the problem is worth solving and whether the intended behavior, boundaries, and acceptance criteria are correct.
2. During verification, examine evidence that the implementation meets the acceptance criteria. Tests, demonstrations, and review by an independent agent can contribute evidence, provided the checks exercise the actual risks.
3. Before acceptance, identify remaining uncertainty and decide whether to accept the remaining uncertainty. Inspect consequential code directly, including permissions, possible data loss, architectural decisions, and changes that are difficult to reverse.

Under this proposal, the pull request explains the intended change, supplies verification evidence, and states remaining uncertainty. The code remains available for inspection, and reviewers can challenge the claims and the evidence.

Independent agents may increase review capacity. Review by an agent does not remove human responsibility for acceptance. How much confidence independent agent review provides remains an open question.

Generation capacity does not determine acceptance capacity. If generated changes exceed the capacity to verify changes responsibly, possible responses include reducing the scope of each change, limiting concurrent changes, or leaving changes unmerged.

## Code correctness and agreement with the description

Jérôme Étienne distinguishes verification of the code from the human decision to accept the proposed change. Code verification must check that the implementation matches the pull request description, fixes the described bug or implements the described feature, and checks for new bugs and security issues. Tests and code review provide evidence for these checks; passing checks cannot establish the absence of every possible bug.

Jérôme Étienne considers AI-assisted code verification practical with Codex and Claude Code and is not primarily concerned about that part of the process. This is the position expressed in the discussion, rather than a measured claim about the reliability of those tools.

The intended direction is for human review to work from the pull request description. That direction makes the quality of the description and the agreement between the description and the code essential.

## Describing a bug fix or a new feature

For a bug fix, the description needs a clear account of the bug, steps to reproduce the bug, the expected behavior, and steps to evaluate whether the bug has been fixed.

For a new feature, begin with user scenarios, derive a design that supports the user scenarios, and implement the design. The discussion called this scenario-driven design, with Behavior-Driven Development as a related approach when scenarios become explicit acceptance criteria. These names were suggested during the discussion; the naming is not a settled methodological choice.

The description of a new feature needs the user scenarios, expected behavior, acceptance criteria, and validation steps. The description should allow a reviewer to evaluate the proposed behavior and allow an agent to compare the implementation with the proposed behavior.

## Skills for writing and reviewing pull request descriptions

Jérôme Étienne wants skill support both for producing a proper pull request description and for checking whether a pull request description provides all the required information and steps. AI writes the description, so description quality needs an explicit check.

The assistant proposed two distinct skill responsibilities:

- Write the pull request description with the information appropriate to a bug fix or a new feature.
- Review the pull request description for completeness and clarity, identify missing information, and request corrections.

For either kind of change, the proposed description review also checks scope, consequential effects, verification results, and remaining uncertainty. These additional checks are assistant proposals for further discussion.

Checking the completeness of the description and checking that the code matches the description are separate requirements. A description can be clear but incomplete, and code can match an incomplete description while containing consequential changes the human has not reviewed.

The assistant proposed reviewing the description before code verification. The ordering, the exact skill structure, and the required description format remain to be decided. No new skill has been implemented.

## Symbiospec as the basis for wanted behavior

Jérôme Étienne identifies Symbiospec as the shared product specification for humans and AI, providing a basis for deciding whether a proposed feature is wanted. The discussion refers to the repository's [Symbiospec skill](../../skills/symbio_spec/SKILL.md).

The skill separates observed implementation, proposed specification, and approved specification. Humans approve product decisions, and coding agents use approved decisions to guide implementation and verification. Existing code and tests provide evidence; existing code and tests do not automatically authorize product behavior.

Applied to pull request review, this suggests checking two relationships: whether the pull request description agrees with the approved Symbiospec, and whether the code agrees with the pull request description. This connection is an interpretation of the skill for the current discussion, not an implemented review workflow.

When a proposed change introduces a new product decision, the decision needs human review unless existing authorization already covers the decision. The skill requires affected specifications to be updated alongside authorized software changes and prohibits silently rewriting approved expectations to accommodate a regression.

## Proposal, acceptance, and implementation

Jérôme Étienne describes the intended feature workflow as follows:

1. Write a proposal in the project's Symbiospec folder describing the proposed feature.
2. Have the human review and accept the proposal before implementing the proposed feature.
3. Implement the accepted proposal and incorporate the accepted product meaning into the relevant approved Symbiospec areas, such as Behaviour.
4. Connect the pull request to the accepted proposal so reviewers can verify that the implemented feature is the feature that was wanted.

Acceptance of the proposal establishes the intended product decision. Verification of the implementation remains necessary: acceptance does not prove that the code implements the proposal correctly or that the code has been tested.

This sequence records Jérôme Étienne's proposed approach for the discussion. The precise timing of incorporating the accepted proposal into the approved specification and the handling of proposal history remain to be defined. The reusable Symbiospec workflow instructions have not been changed; the skill overview has been updated to explain the name.

## Explicit repository rules and their framework

Jérôme Étienne identifies The Rules of the Repo as another part of the review approach. Repository requirements must be clearly expressed and formalized inside the repository so coding agents can find, understand, and apply the requirements. Expectations left unstated cannot provide a dependable basis for automated review.

The Rules of the Repo provides the common entry point: a rules list identifies which rule skills apply to a change and supplies the configuration for each rule skill. The framework distinguishes static rules from living rules, including rules whose changes require human approval. See [The Rules of the Repo](../../skills/rules_of_the_repo/SKILL.md).

Examples raised by Jérôme Étienne include maintaining Symbiospec alongside authorized product changes, following Repo Folders Constraints when placing code or creating packages, and following the repository's coding style. Repo Folders Constraints is one rule within the framework, rather than a competing framework. See [Repo Folders Constraints](../../skills/repo_folders_constraints/SKILL.md).

The assistant suggested additional possible rule areas: dependencies, security, verification evidence, compatibility, database changes, and documentation. These examples are possibilities for discussion, not newly adopted rules for this repository.

Applied to pull request review, the approach adds a check that the change follows the applicable repository rules. A useful review report would identify the applicable rules, evidence of compliance, violations, and checks that could not be completed. Writing down a rule does not by itself prove that an agent enforced the rule correctly.

## The meaning of the name Symbiospec

Jérôme Étienne defines the symbiotic relationship as collaboration between humans and AI toward one shared goal. The preferred introduction is “the shared product specification for humans and AI”. The [Symbiospec skill overview](../../skills/symbio_spec/README.md) now explains that meaning.

## Questions still open

- What must a human understand to responsibly accept a particular change?
- Which changes require direct human inspection of the code, and how are those changes identified?
- What makes review by another agent sufficiently independent, especially when agents may share assumptions or make similar mistakes?
- Who defines and reviews the acceptance criteria and verification evidence?
- How can reviewers detect incomplete evidence or an incorrect understanding of the problem?
- How should a pull request present evidence and uncertainty in a form a human can assess?
- Who has authority to accept a change, and what responsibility does acceptance carry?

These notes preserve the conversation so the discussion can continue. No review policy or implementation has been agreed.
