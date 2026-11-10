# rename_agent_project

Rename a local repository folder and keep its Codex and Claude Code conversations available when you open the renamed folder normally.

One command lists affected terminals, waits for you to close those clients manually, creates verified backups, renames the folder, updates conversation associations, repairs linked Git worktrees, and verifies the result. Failed operations attempt a checked rollback. The independent worker continues if the initiating terminal closes.

## Use

Requires Node.js 24 or later and pnpm. Install dependencies with `pnpm install` from the repository root.

Preview a rename:

```bash
pnpm --filter rename_agent_project start --from /absolute/project --to /absolute/project-renamed
```

Add `--apply` to perform the complete rename. A private backup and operation directory is chosen automatically beside the project. The command prints that directory for status and recovery. The shared Codex server and unrelated clients stay running. The tool never sends shutdown signals.

```bash
pnpm --filter rename_agent_project start --status /absolute/operation-directory
pnpm --filter rename_agent_project start --restore /absolute/operation-directory
pnpm --filter rename_agent_project start --restore /absolute/operation-directory --apply
```

Restoration refuses to overwrite newer project work or changed conversation records. Keep the operation directory until you have checked the renamed project and conversations.

Use `--help` for every option, including `--only`, custom application storage, `--backup`, and `--detach`. All options are defined in [src/cli.ts](src/cli.ts). A rename started inside an affected Codex conversation returns immediately. Use the printed status command to see which clients to close manually. Closing a client can leave its task running; the tool also waits for affected tasks to finish.

## Supported scope

Codex and Claude Code command-line applications on macOS and Linux. Affected open clients and affected background tasks cause waiting, with instructions in the terminal. Unrelated clients and unrelated background tasks may continue. Unknown storage formats and conflicting destinations cause refusal. Live application testing currently covers macOS with Codex 0.167.0 and Claude Code 2.1.322; Linux is not live-verified.

Keep affected clients closed until completion. The command checks for reopened affected clients before writes and preserves conversation identity and history. Embedded absolute paths in instructions, launchers, installed skill links, and editor workspaces are not rewritten. Desktop applications and editor integrations are outside the supported scope.

## Development and evidence

```bash
pnpm --filter rename_agent_project test
pnpm --filter rename_agent_project check
```

Tests stay in [tests](tests), beside [src](src). Strict TypeScript targets ES2020 and runs through `tsx`. [src/index.ts](src/index.ts) exports the package interface; implementation belongs in [src/migration](src/migration) and [src/operation](src/operation).

The approved synthetic testbed uses `rename_agent_test_project`, synthetic files, three new Claude Code conversations, and three new Codex conversations. All six were selected from the normal pickers after renaming, recalled their distinct earlier facts, and wrote verification files in the renamed folder. Actual user projects and existing conversations were excluded. See the [testing evidence and recovery notes](../../docs/conversations_after_folder_rename.md) and [implementation issue](https://github.com/jeromeetienne/coding_agent_plugin/issues/64).
