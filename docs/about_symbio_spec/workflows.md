# Symbiospec workflows and audits

- Created: 28 October 2026
- Last updated: 14 November 2026
- Status: Maintained explanation of the workflows of Symbiospec for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related rules: [docs_folder_system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 15](https://github.com/jeromeetienne/coding_agent_plugin/issues/15), [Issue 10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10), [Issue 11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11)

## 0. Introduction

### 0.1. Workflows and audits

Explains Initialization, Update, Realignment, Symbiospec Audit for self-consistency, and Symbiospec Audit for software compliance without repeating the coding-agent procedures.

### 0.2. Practical review

Shows a small initialization cycle, an authorized update and a scoped comparison report, with approval and verification limits.

## 1. Overview

Initialization, Update, and Realignment maintain Symbiospec. Symbiospec Audit for self-consistency and Symbiospec Audit for software compliance provide explicitly requested reviews. Initialization establishes a baseline and may continue incrementally in uncovered areas while Update maintains already established areas. Update and Realignment repeat throughout development. This document explains each workflow as a concept. The steps for a coding agent are in [workflows.md](../../skills/symbio_spec/references/workflows.md) of the skill `symbio_spec`.

## 2. Initialize

Initialize starts Symbiospec in a project.

- New software: the coding agent creates the folder structure. The empty templates are not approved definitions. Then the project starts to use update.
- Existing software: the coding agent uses slow growth. The coding agent finds a few clear concepts, the human approves the concepts, and the coding agent documents a small part of the product around the concepts. Then the cycle starts again with the next concepts. The existing code is evidence, but the existing code is not automatically the intended behaviour.
- Existing specification: the coding agent keeps the content and the approvals that exist, and proposes a migration in small steps.

Slow growth is necessary because an incorrect concept makes errors in all the descriptions that use the concept. Small reviewed steps stop these errors early.

## 3. Update

Update keeps Symbiospec current when the software changes. The coding agent changes the software and the affected parts of Symbiospec in the same task.

The human does not approve again a decision that the human already approved for the change. A new product decision that is not in that approval goes to the human for review. An unexpected result of the implementation never becomes an approved requirement silently.

## 4. Realign

Realign finds and corrects drift: a difference between Symbiospec, the software, and the tests that update did not find.

1. The coding agent compares Symbiospec with the software and the tests, and changes nothing.
2. The coding agent reports each difference, with the evidence.
3. The human reviews a prepared batch of corrections. A correction can change the software, Symbiospec, the tests, or more than one of them.
4. The coding agent applies the approved corrections, and does the comparison again.

The approved intent stays the reference. Realign never changes the approved specification only to make an incorrect implementation look correct.

## 5. Explicitly requested audits

**Symbiospec Audit for self-consistency** examines whether approved descriptions agree internally and use consistent terminology. Approved user scenarios in scope must be possible to follow using Symbiospec alone. A rule requiring all readers to sign in conflicts with an approved user scenario requiring access without an account. A missing description of an action needed by a user scenario is also a finding. This review does not establish whether the software works.

**Symbiospec Audit for software compliance** compares in both directions: does software implement approved expectations, and are software capabilities described in Symbiospec? A sharing feature that displays success after a failed request can violate an approved rule. A feature providing expiring sharing links can be undocumented even when no written rule forbids the feature. Symbiospec remains authoritative; discovering the feature does not approve the feature or authorize adding the feature to Symbiospec.

The human chooses either audit or both audits, the scope, and the timing. The human may say, “Run Symbiospec Audit for self-consistency for sharing after we finish discussing these rules.” Neither audit runs automatically after every rule change. A conflict already noticed during discussion is mentioned without automatically launching an investigation or requiring an audit before rule approval.

An audit ends with findings and evidence limits. Realignment can continue from findings into authorized corrections. Source inspection, executed tests, and direct application observations establish different evidence; no audit should claim tests that did not run or complete coverage from a partial review. The [workflow overview](../../skills/symbio_spec/references/workflows.md) links to the separate coding-agent procedures.

## 6. A small initialization cycle

For the fictional note editor in the [specification example](specification_example.md), the coding agent first inspects saving one Note. The coding agent prepares the Note definition, save expectations, evidence, uncertainties and the relationship to the Save control. The human reviews the prepared decisions and can accept, reject, revise or defer each decision. Questions requiring substantial new investigation move into a later batch.

After actual approval, the coding agent records the source and scope of the decision, updates the topic and coverage records, and checks navigation and consistency. Saving one Note can be an approved baseline while sharing and deletion remain unexamined. An earlier specification is preserved and incrementally migrated rather than discarded; an unknown approval history stays explicit.

## 7. Update and Realignment examples

An authorized request to change save confirmation wording permits the corresponding Behaviour and User Interface updates in the same task without asking again. If implementation exposes a new question about overwriting another Note, that additional product decision needs review. A technical refactoring with unchanged product meaning needs no artificial rewrite of the specification.

A request to review failed saves permits comparison and reporting. For example, a report might contain the following fictional finding:

| Field | Example finding |
| --- | --- |
| Scope | Save failure only; sharing and deletion not examined. |
| Expected | The approved save specification requires a failure message and no success confirmation. |
| Observed and evidence | A permitted application exercise shows a success confirmation after a rejected write; the relevant test expects success. Link the actual observation and test when reporting a real finding. |
| Severity and confidence | High impact because saving appears successful; high confidence within the exercised failure case. |
| Recommendation | Correct the application and conflicting test while preserving approved intent. |
| Decision and resolution | Investigation alone does not authorize corrections. Apply authorized corrections, repeat the failed-save exercise and record resolved or remaining findings. |

A missing test is a coverage gap, not proof of a broken feature. Reports saved with authorization belong in `docs/symbio_spec/reports/`; otherwise findings can remain in the conversation. Approval, executed tests and live observations remain separate evidence.

## 8. Limits and further work

[Issue 11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11) proposed these three operations; the current [workflow reference](../../skills/symbio_spec/references/workflows.md) supplies coding-agent instructions. The skill does not establish a recurring schedule, automatic scope selection, a dedicated executable comparison tool or complete alignment from a partial investigation. Saving a report and correcting software remain subject to the request's authorization.

Review meaningful product differences rather than copying the whole specification into every review record. Reports identify examined and unexamined scope, approval evidence, unresolved questions and checks actually run. Product review complements technical verification; approval of documentation does not establish application correctness.

## 9. Sources

- [Issue #11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11): Symbiospec workflow guide.
- [workflows.md](../../skills/symbio_spec/references/workflows.md) of the skill `symbio_spec`.
