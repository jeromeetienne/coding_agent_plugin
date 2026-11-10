# Directory Context: `/packages/rename_agent_project/src/operation`

## Purpose

Coordinate a recoverable project folder rename with manual client closure, backups, conversation migration, and verification.

## Key Exports & Entry Points

- `OperationJob`: launch an independent worker and inspect its durable result.
- `RenameOperation`: run or recover a recorded rename operation.
- `AgentProcesses`: identify affected terminals and wait for manual closure while shared servers and unrelated clients continue.
- `ProjectFiles`: snapshot, back up, and verify project files and Git worktrees.
- `OperationJournal`: persist progress outside the project folder.

## Rules

- Progress, worker code, backups, and process locks remain outside the folder being renamed.
- The worker runs independently of its initiating application and does not depend on the old source path.
- No operation sends application shutdown signals or stops the shared Codex server.
- Affected clients must be closed manually and affected turns must finish before writes.
- Unrelated clients and unrelated turns may remain active; verification checks only selected conversation rows.
- Source data is backed up and verified before migration or rename writes.
- Failed operations restore only state whose expected contents still match.
- Application-level development tests use the approved synthetic project and six new conversations only.

## Background

- https://github.com/jeromeetienne/coding_agent_plugin/issues/64
