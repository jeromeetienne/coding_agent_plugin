# Rename a project and preserve its conversations

- Created: 10 November 2026
- Last updated: 14 November 2026
- Status: Implemented workflow with synthetic application testing
- Related framing: [Agent instructions](../../../AGENTS.md)
- Related rules: [Docs folder system](../../../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 64](https://github.com/jeromeetienne/coding_agent_plugin/issues/64)

For people renaming a project: this guide answers how to preserve supported Codex and Claude Code terminal conversations.

## Current workflow

[rename_agent_project](../../../packages/rename_agent_project/README.md) performs the folder rename and conversation migration together. Run a preview with absolute `--from` and `--to` paths, then add `--apply`. The tool lists affected terminal clients and waits for you to close those clients manually and finish their background tasks. The shared Codex server and unrelated clients stay running. After those checks, the tool verifies backups, moves the folder, repairs Git worktrees, and verifies conversation identities and storage associations. No shutdown signals are sent.

A bundled worker runs from a private directory outside the project. Progress and backup locations are printed when the worker starts. `--status <operation-directory>` reads durable progress. `--restore <operation-directory>` previews restoration; adding `--apply` waits for manual closure of affected clients and restores the folder and recorded conversation data. Restoration refuses changed targets rather than discarding newer work. No manual folder rename or application-shutdown confirmation flag is required.

The tool preserves Codex transcript bytes, identifiers, and unrelated database fields. Claude Code migration changes project associations while retaining messages. Git worktree administration paths are repaired separately. Absolute paths embedded in instructions, launchers, installed skill links, and editor workspaces remain outside the migration scope. Desktop applications and editor integrations are not supported. Linux process inspection is implemented but has not been live-verified.

## Run the tool

Read the [package instructions](../../../packages/rename_agent_project/README.md) for prerequisites and commands.

From this repository, preview the operation with absolute paths:

```bash
pnpm --filter rename_agent_project start --from /absolute/old-project --to /absolute/new-project
```

Review the preview before adding `--apply`. Follow the printed instructions to close affected clients, keep affected clients closed until completion, and retain the reported operation directory and backups for recovery. The package instructions describe status and restoration commands.

## Verification limits

The [verification history](verification_history.md) records synthetic application exercises, automated failure and recovery tests, and their limits. Historical success does not establish support for every application version or storage configuration. Development mutation uses synthetic projects and new conversations; existing user conversations are excluded from development tests.
