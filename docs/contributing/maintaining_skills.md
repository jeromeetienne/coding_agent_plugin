# Maintain the shared skills

- Created: 9 November 2026
- Last updated: 14 November 2026
- Status: Maintained contributor guide
- Related framing: [Agent instructions](../../AGENTS.md)
- Related rules: [Docs folder system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [#37](https://github.com/jeromeetienne/coding_agent_plugin/issues/37)

## Maintain the skills

This repository is independent and is the authoritative location for all skills. Make future skill changes directly in this repository. Projects that use the skills, including Heidrun, receive changes from this repository and do not control how the skills are maintained.

Copies installed in other projects and user configurations are not synchronized automatically. Updating those copies is a separate action.

The `jerome-typescript-javascript-style` reference contains Jérôme Étienne’s personal rules, including changes he explicitly requests. Do not rewrite those rules as part of general documentation maintenance; changes to the rules require his explicit instructions.

## History

The collection originated in Heidrun and Jérôme Étienne’s personal coding preferences. The original extraction records remain available through [repository history](https://github.com/jeromeetienne/coding_agent_plugins/issues/16).

## Documentation maintenance

Update the affected skill README and shared guides alongside an authorized skill change. Check examples and approval boundaries against the instructions. Update the collection overview, dependency reference, and documentation navigation when a skill is added, removed, renamed, or changes status. Follow the [publication guide](publishing.md) to verify the website after a merge.

## Documentation conventions

For contributors maintaining this repository: this section answers where documentation belongs and what a useful document must contain.

Every new document names its intended reader and the question the document answers in its introduction. Update an existing document when the existing document already answers the question. Keep one main explanation of each subject.

- The root collection overview lists skills, readiness, and entry points.
- Each skill README explains adoption and use; SKILL.md and bundled references hold authoritative coding-agent procedures.
- The using_skills folder explains installation, configuration, and combining skills.
- The contributing folder explains maintenance and website publication.
- The tools folder holds practical tool guides with historical verification evidence kept separate.
- The existing about_symbio_spec and coding_in_ai_era folders hold their respective topic explanations.

Follow [Docs folder system](../../skills/docs_folder_system/SKILL.md) with the [repository configuration](../../.agents/rules_of_the_repo/config/docs_folder_system/config.md). Every documentation folder has a short README for people and an index for agents and tools. Every document has the required metadata after its title; preserve Created and update Last updated. Update navigation with every move, addition, or removal.

Use relative links and established names. Preserve approval boundaries, personal preferences, and readiness warnings. Review explanations against authoritative instructions. Run git diff --check, verify relative links and heading targets, and run the repository checks from AGENTS.md. Source review, test execution, publication, and visual review are separate evidence.

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
