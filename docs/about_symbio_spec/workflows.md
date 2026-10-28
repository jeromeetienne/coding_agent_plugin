# The three workflows of Symbiospec

- Created: 28 October 2026
- Last updated: 28 October 2026
- Status: Maintained explanation of the workflows of Symbiospec for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related issue: [#15](https://github.com/jeromeetienne/coding_agent_plugin/issues/15)

## 1. Overview

Symbiospec has three workflows. Initialize occurs one time for each project. Update and realign occur again and again during all the development. This document explains each workflow as a concept. The steps for a coding agent are in [workflows.md](../../skills/symbio_spec/references/workflows.md) of the skill `symbio_spec`.

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

## 5. Sources

- [Issue #11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11): Symbiospec workflow guide.
- [workflows.md](../../skills/symbio_spec/references/workflows.md) of the skill `symbio_spec`.
