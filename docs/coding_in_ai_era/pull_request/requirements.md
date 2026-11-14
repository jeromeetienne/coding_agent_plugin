# Pull request review requirements

- Created: 14 November 2026
- Last updated: 14 November 2026
- Status: Requirements captured during discussion; incomplete
- Related framing: [Discussion notes](discussion_notes.md)
- Related issue: [Issue 78](https://github.com/jeromeetienne/coding_agent_plugins/issues/78)

This document collects the requirements expressed during the discussion so Jérôme Étienne can review the overall approach and identify missing requirements. The requirements describe the intended review process; the review skills are not implemented.

Requirement identifiers remain unchanged when requirements are reordered. Retired identifiers are not reused.

## REQ-001 — Validate the pull request description

Provide a process that checks whether the text of a pull request description contains the information required to understand and evaluate the proposed change. Identify missing or unclear information so the description can be corrected.

For a bug fix, require a description of the bug, reproduction steps, expected behavior, and steps to verify the fix. For a new feature, require user scenarios, expected behavior, acceptance criteria, and validation steps.

The exact validation process and complete list of required information remain to be defined.

## REQ-002 — Support writing the pull request description

Provide skill support that helps AI write a description satisfying the description requirements. Writing the description and validating the description are separate responsibilities; the final skill structure remains to be decided.

## REQ-003 — Verify the implementation

Check for bugs and security issues, and verify that the code matches the pull request description. Verify that the implementation fixes the described bug or delivers the described feature. Record evidence and the limits of verification; passing checks do not prove the absence of every bug or security issue.

## REQ-004 — Establish that the product change is wanted

Use Symbiospec as the reference for intended product behavior. For a proposed feature, describe the feature in a Symbiospec proposal, obtain human acceptance before implementation, and incorporate accepted product meaning into the relevant approved specification areas. Connect the pull request to that accepted product decision.

## REQ-005 — Check repository rules

Keep repository rules explicit and available inside the repository through The Rules of the Repo. Check each change against the applicable rules, including Repo Folders Constraints, coding style, and maintaining affected Symbiospec documents alongside authorized changes.

## REQ-006 — Require human approval before merging

A pull request must not be merged automatically because AI verification succeeds. A human must authorize the merge. Approval of a Symbiospec proposal authorizes the product change; approval to merge authorizes integrating the implementation into the destination branch.

The evidence and presentation needed for an informed human merge decision remain to be defined.
