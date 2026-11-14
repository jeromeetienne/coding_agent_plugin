# Repo Folders Constraints

These rules record the approved responsibilities of the folders below. Changes to these rules require human approval. Folders without a rule, and values marked "not decided yet", need a decision before a change that depends on them.

## Packages

| Folder | Does | Never does | May import | Language and technologies | Workflow |
| --- | --- | --- | --- | --- | --- |

## Other folders

| Folder | Does | Never does | Language and technologies | Workflow |
| --- | --- | --- | --- | --- |
| `skills/` | Holds reusable skill instructions and supporting scripts, templates, and references. | Holds repository-specific configuration or standalone executable tools. | Markdown instructions; supporting files use the format the skill needs. | Make reusable skill changes here; maintain standalone executable tools in separate repositories. |
| `docs/` | Holds documentation for people and links to skill instructions. | Copies skill instructions. | Markdown. | Follow `docs_folder_system`. |
| `docs/using_skills/` | Explains skill installation, configuration, and combinations. | Copies authoritative skill instructions. | Markdown. | Follow `docs_folder_system`; keep navigation short. |
| `docs/contributing/` | Explains collection maintenance and publication. | Copies authoritative skill instructions. | Markdown. | Follow `docs_folder_system`; keep navigation short. |
| `docs/tools/` | Links to independently maintained executable tools. | Copies authoritative skill instructions. | Markdown. | Follow `docs_folder_system`; keep navigation short. |
| `.agents/skills/` | Holds installed copies of skills. | Serves as the authoritative source for reusable skill changes. | Installed skill files. | Install copies here; make reusable skill changes in `skills/`. |
| `.claude/skills/` | Links to installed skills in `.agents/skills/`. | Holds independent authoritative copies of reusable skills. | Symbolic links. | Keep links pointing to the installed skills. |
| `.agents/rules_of_the_repo/` | Holds the rules list and repository-specific configuration. | Holds reusable skill instructions. | Markdown. | Follow `rules_of_the_repo`; changes to folder constraints require human approval. |
| `.agents/worktrees/` | Holds temporary worktrees for issue fixes. | Serves as permanent storage for completed issue worktrees. | Git worktrees. | Follow `issue_fix_workflow` or `issue_batch_workflow`; remove temporary worktrees when the workflow finishes. |
