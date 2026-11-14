# pull_request_creation

## Purpose

Pull Request Creation helps a coding agent publish a reviewable GitHub pull request with a concrete title, a description grounded in the complete change, and honest validation evidence.

## When to use

Use when creating a pull request or updating a pull request title or description. Implementation, review approval, merge, and deployment follow the receiving repository's workflow.

## Requirements and configuration

Use an installed, authenticated `gh` command with access to the target repository. No companion skill or configuration file is required. Read the receiving repository's instructions for destination branches, publication commands, pull request templates, and approval requirements.

## Install

```bash
npx skills add jeromeetienne/coding_agent_plugins --skill pull_request_creation
```

See [shared installation options](../../README.md#install-the-skills).

## Results and review

The result is a published or updated pull request explaining the problem, resulting behavior, and relevant verification. The coding agent reads back the published text, branches, and file list. Creation does not authorize merge or deployment.

## Instructions and related skills

- [SKILL.md](SKILL.md): authoritative writing, publication, and verification instructions, with an example.
- [issue_creation](../issue_creation/README.md): record a request or problem.
- [issue_fix_workflow](../issue_fix_workflow/README.md): implement and review one issue before completion.
