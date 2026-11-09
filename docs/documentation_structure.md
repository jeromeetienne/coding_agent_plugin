# Documentation structure

- Created: 9 November 2026
- Last updated: 9 November 2026
- Status: Approved structure for the skill collection
- Related framing: [Agent instructions](../AGENTS.md)
- Related issue: [Issue 39](https://github.com/jeromeetienne/coding_agent_plugin/issues/39), part of [Issue 37](https://github.com/jeromeetienne/coding_agent_plugin/issues/37)

## Agreed scope

The developer approved a concise root overview, individual skill README files explaining adoption and use, and shared explanations in docs. This document records the agreement; the [skill inventory](skill_inventory.md) supplies the source-reviewed coverage and work order.

SKILL.md and bundled references remain authoritative for coding-agent procedures. Reader documentation explains existing behaviour without copying complete procedures or changing skill behaviour, personal preferences, human-owned rules or product decisions.

## Documentation locations

| Location | Responsibility | Navigation |
| --- | --- | --- |
| [Root README](../README.md) | Short collection purpose, complete skill list with readiness, installation entry point, essential receiving-project setup and maintenance guidance. | Link individual skill README files and the documentation overview. Move detailed explanations only when the detail remains available at a linked destination. |
| Each skill README.md | Help a person decide whether and how to adopt one skill using the common coverage below. | Link authoritative instructions, bundled references, companions and relevant shared guides. |
| Each SKILL.md and bundled references | Exact coding-agent triggers, procedures, limits and reusable templates. | Keep receiving-project configuration outside reusable skill folders. |
| [docs/README.md](README.md) | Human overview of shared explanations and guides. | Link the inventory, agreed structure, conceptual guides and shared workflows. |
| [docs/index.md](index.md) and nested indexes | File discovery for coding agents and tools. | One relative-link bullet per file/subfolder; subfolders link through index.md. |
| Shared guides in docs | Concepts spanning skills, how skills combine, and deeper adoption explanations. | Link relevant skill README files and instructions; keep one main explanation of each shared subject. |

## Common skill README coverage

Use the following order for supported skills. Existing headings may remain when those headings clearly cover the same needs. State explicitly when no configuration or companion is needed. Make obsolete or draft status visible immediately after the title.

| Topic | Content |
| --- | --- |
| Purpose | What the skill helps a person accomplish and the problem addressed, using the established name. |
| When to use | Concrete requests or situations and significant scope limits. |
| Requirements | Tools, access, files, project data and required companions; distinguish useful pairings. |
| Install | Command selecting the distributed name and required companions; link shared installation options. Explain that installation does not configure a receiving project or approve changes. |
| Configuration | Caller-supplied values and paths, missing-value behaviour, and a complete small example or maintained configuration-reference link with example assumptions. State when configuration is unnecessary. |
| Concrete example | Realistic request with enough example inputs to understand the action and expected response or document. Label illustrative paths and data. |
| Results | Files, reports, proposals or other outcomes, how to review the outcomes, and remaining task limits. |
| Approval boundaries | Existing authorization, decisions needing human review, and special limits such as advice-only review, draft adaptations or separate publication. Preserve the different individual/batch issue workflows. |
| Related skills and guides | Required relationships first, optional pairings second; give relative links and reasons. Mark obsolete relationships. |
| Instructions and references | Links to SKILL.md and relevant bundled format, configuration, workflow or style references. |

For example, a docs_folder_system adoption example can show a project choosing docs as the documentation folder and none as the metadata exceptions, followed by adding a guide with metadata and an index entry. Link the exact instruction template rather than repeating the full procedure. A git_cleanup_review example ends in a report and ordered recommendation; removal is separate. A Rust example uses active rules and leaves uncertain adaptations undecided.

## Shared guides and navigation

Readers start at the root overview, choose a skill README, then follow shared guides for broader explanation. Coding agents follow instruction links for execution. Keep the existing [The Rules of the Repo guide](rules_of_the_repo.md) and [About Symbiospec documents](about_symbio_spec/README.md); preserve useful text and avoid duplicate full explanations.

The dedicated Repo Folders Constraints guide is coordinated under [Issue 26](https://github.com/jeromeetienne/coding_agent_plugin/issues/26). The explanation of development skills working together is coordinated under [Issue 36](https://github.com/jeromeetienne/coding_agent_plugin/issues/36). Symbiospec definition and workflow requests remain coordinated under [Issue 10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10) and [Issue 11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11). The guides are linked from the documentation overview.

Use relative links for repository documents and descriptive link text. External issue links use the full GitHub issue address. Keep established names consistent.

Every docs file has a title followed immediately by Created, Last updated, Status and Related framing metadata; include Related rules when applicable and Related issue when an issue exists. Use day, month name and year; preserve Created and update Last updated on edits. Every documentation folder has README.md for people and index.md for agents/tools. Update navigation in the same change as the document. These requirements come from [docs_folder_system](../skills/docs_folder_system/SKILL.md) and its [repository configuration](../.agents/rules_of_the_repo/config/docs_folder_system/config.md).

## Review and evidence

Compare reader explanations with the current instructions and relevant references. Preserve required inputs, stop conditions, ownership, approval boundaries and readiness warnings. Check relative file links, heading targets, metadata, folder indexes and changed Markdown; run git diff --check and appropriate documentation checks.

Source review, installation, tool execution, application checks and publication checks are separate evidence. An example command is not a claim that the command ran successfully. This repository has no application, package manifest, build or test suite.

## Publication

Use built-in GitHub Pages/Jekyll branch publication. No package.json or separate build tool is planned. The publication destination is GitHub Pages, with updates from the main branch. The publication guide will describe how to maintain and check the website.

[Issue 53](https://github.com/jeromeetienne/coding_agent_plugin/issues/53) owns publication configuration, website navigation, any rendered-link adjustments and ongoing update instructions, including the published branch and folder. Keep the Markdown source as maintained content and verify local links as well as rendered destinations. Completion should check published navigation, direct page loads, access without signing in and narrow-screen presentation. Report publication and live verification separately from content review. The publication guide records the active configuration and verification procedure.
