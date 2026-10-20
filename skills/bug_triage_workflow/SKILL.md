---
name: bug_triage_workflow
description: Review a repository's open issues and recommend which to handle first, keep, clarify, or close, with evidence. Use when the developer asks to triage issues or review the open issue list. The review is read-only; close an issue only when the developer explicitly asks and names its number.
---

# Bug Triage Workflow

Review open issues so the developer can decide what needs attention and what can be closed. This workflow is a work in progress, refined through real use.

Start only when the developer asks for a triage. Use the repository and scope named by the developer. Do not assume that particular labels, configuration files, or another workflow exist.

## 1. Collect

Collect all open issues in the requested scope from the repository’s issue tracker, whether GitHub or GitLab. Retrieve every page of results. Do not treat one page or a command’s default result limit as the complete issue list.

Read each issue and its comments. Read relevant code and history when needed to assess a claim. For a duplicate, read the proposed original issue. For a tracking issue, check the status of the linked work.

If access or another limit prevents a complete review, state which issues were reviewed and what remains. Do not report a partial review as complete.

## 2. Assess

Describe what each issue is about in plain words, such as a bug, feature request, question, note, tracking issue, or duplicate. These descriptions are for the report; they do not require matching labels in the repository.

Choose a recommendation based on the evidence:

- **Handle first:** the issue needs attention, especially when a bug risks data loss or blocks normal use. Explain the reason for the priority.
- **Keep:** the issue describes useful work or information that still applies.
- **Clarify:** the issue needs more information before a decision can be made. Name the missing information.
- **Close:** there is evidence that the work is complete, the issue duplicates another issue, or the issue no longer applies. A decision not to pursue work belongs to the developer.

Age alone is not a reason to close an issue. Missing information is a reason to request clarification, without an automatic deadline for closure.

The review is read-only. Do not change files, labels, or issues, write comments, start the application, or attempt to reproduce bugs during the review.

## 3. Report

Write the report in the chat. For each issue, include:

- A link to the issue and a short description.
- The recommendation and the reason.
- The evidence: what was read and what the evidence establishes.
- What remains uncertain or was not checked. Mark bugs as “not tested” because the review does not reproduce them.

Put issues needing attention first. Distinguish evidence that work is complete from an assumption based on an issue’s age, labels, or title.

## 4. Decide

Wait for the developer’s decisions. A recommendation to close an issue is not permission to close the issue.

Close an issue only when the developer explicitly requests closure and names the issue number. Record the reason and, for a duplicate, link to the original issue. Use the issue tracker’s appropriate closure status when available.

Make other issue changes, including labels and comments, only when the developer explicitly requests those changes for named issues. Fixing an issue is separate work from reviewing the issue list.
