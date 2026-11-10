# Repo Folders Constraints

These rules record the approved responsibilities of the folders below. Changes to these rules require human approval. Folders without a rule, and values marked "not decided yet", need a decision before a change that depends on them.

## Packages

| Folder | Does | Never does | May import | Language and technologies | Workflow |
| --- | --- | --- | --- | --- | --- |
| `packages/rename_agent_project/` | Owns the conversation migration tool, dependencies, tests, and instructions. | Stores another tool's implementation or dependencies. | no other package | TypeScript; other requirements follow the repository instructions and package configuration. | Keep the tool in its own folder; manage the package through the root pnpm workspace. |

## Other folders

| Folder | Does | Never does | Language and technologies | Workflow |
| --- | --- | --- | --- | --- |
| `skills/` | Holds reusable skill instructions and supporting scripts, templates, and references. | Holds repository-specific configuration or standalone executable tools. | Markdown instructions; supporting files use the format the skill needs. | Make reusable skill changes here; keep standalone executable tools in `packages/`. |
| `packages/` | Holds executable tools in separate package folders. | Mixes the implementations or dependencies of separate tools. | pnpm workspace; each package follows the repository technology rules. | Each tool owns its dependencies, tests, and instructions; pnpm manages the packages together. |
| `docs/` | Holds documentation for people and links to skill instructions. | Copies skill instructions. | Markdown. | Follow `docs_folder_system`. |
| `.agents/skills/` | Holds installed copies of skills. | Serves as the authoritative source for reusable skill changes. | Installed skill files. | Install copies here; make reusable skill changes in `skills/`. |
| `.claude/skills/` | Links to installed skills in `.agents/skills/`. | Holds independent authoritative copies of reusable skills. | Symbolic links. | Keep links pointing to the installed skills. |
| `.agents/rules_of_the_repo/` | Holds the rules list and repository-specific configuration. | Holds reusable skill instructions. | Markdown. | Follow `rules_of_the_repo`; changes to folder constraints require human approval. |
| `.agents/worktrees/` | Holds temporary worktrees for issue fixes. | Serves as permanent storage for completed issue worktrees. | Git worktrees. | Follow `issue_fix_workflow` or `issue_batch_workflow`; remove temporary worktrees when the workflow finishes. |
