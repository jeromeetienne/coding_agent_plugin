# Maintain the shared skills

- Created: 9 November 2026
- Last updated: 9 November 2026
- Status: Maintained contributor guide
- Related framing: [Documentation structure](documentation_structure.md)
- Related rules: [Docs folder system](../skills/docs_folder_system/SKILL.md)
- Related issue: [#37](https://github.com/jeromeetienne/coding_agent_plugin/issues/37)

## Maintain the skills

This repository is independent and is the authoritative location for all skills. Make future skill changes directly in this repository. Projects that use the skills, including Heidrun, receive changes from this repository and do not control how the skills are maintained.

Copies installed in other projects and user configurations are not synchronized automatically. Updating those copies is a separate action.

The `jerome-typescript-javascript-style` reference contains Jérôme Étienne’s personal rules, including changes he explicitly requests. Do not rewrite those rules as part of general documentation maintenance; changes to the rules require his explicit instructions.

## History

The four workflow skills were extracted from Heidrun with the Git history of their folder. The personal coding style skill was added from Jérôme Étienne’s Claude Code user configuration. The `issue_creation` skill was added from the section "GitHub and GitLab" of the file `AGENTS.md` of Heidrun. The skills `docs_folder_system` and `docs_folder_agents_rules_system` were added from the sections "Agent rules", "Documentation metadata", and "Documentation folders" of the file `AGENTS.md` of Heidrun. The skill `issue_batch_workflow` was added from [heidrun-org/heidrun_notebook#217](https://github.com/heidrun-org/heidrun_notebook/issues/217), without the details of that repository ([#16](https://github.com/jeromeetienne/coding_agent_plugin/issues/16)). The skill `repo_folders_constraints` was added from [heidrun-org/heidrun_notebook#248](https://github.com/heidrun-org/heidrun_notebook/issues/248) and [heidrun-org/heidrun_notebook#249](https://github.com/heidrun-org/heidrun_notebook/issues/249) ([#20](https://github.com/jeromeetienne/coding_agent_plugin/issues/20)). The skill `rules_of_the_repo` was added from [heidrun-org/heidrun_notebook#249](https://github.com/heidrun-org/heidrun_notebook/issues/249) and [heidrun-org/heidrun_notebook#271](https://github.com/heidrun-org/heidrun_notebook/pull/271), and the skills `docs_folder_system` and `docs_folder_agents_rules_system` now take their values from the caller ([#21](https://github.com/jeromeetienne/coding_agent_plugin/issues/21)).

The following issues describe the extraction and the earlier work:

- https://github.com/heidrun-org/heidrun/issues/708
- https://github.com/heidrun-org/heidrun/issues/682
- https://github.com/heidrun-org/heidrun/issues/658


## Documentation maintenance

Update the affected skill README and shared guides alongside an authorized skill change. Check examples and approval boundaries against the instructions. Update the [skill inventory](skill_inventory.md) and documentation navigation when a skill is added, removed, renamed, or changes status. Follow the [publication guide](publishing.md) to verify the website after a merge.
