# Preserve conversations after a project folder rename

- Created: 10 November 2026
- Last updated: 10 November 2026
- Status: Tested batch migration script and individual recovery procedures
- Related framing: [Agent instructions](../AGENTS.md)
- Related rules: [Docs folder system](../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 61](https://github.com/jeromeetienne/coding_agent_plugin/issues/61)


## One-time batch migration script

The [JavaScript script](../src/migrate_conversations.mjs) migrates all indexed Codex conversations and identifiable Claude Code project directories belonging to the old project path, including descendants. The script never renames the repository folder. After migration, launch the command-line applications normally from the new folder and use their ordinary conversation pickers.

Use Node.js 24 or later. From the checkout containing the script, install dependencies once with `pnpm install`. Preview before renaming:

```bash
node src/migrate_conversations.mjs \
  --from /Users/jetienne/webwork/coding_agent_plugin \
  --to /Users/jetienne/webwork/coding_agent_plugins
```

The read-only preview on 10 November found 58 Codex conversations and 13 Claude Code conversations, with one Claude Code project directory and 15 metadata files to update. Counts can change as more conversations are created. No real migration was applied.

Before applying, follow the preparation checklist below, stop all applications using the selected stores, and stop Codex's shared background server with `codex app-server daemon stop`. Stopping that server disconnects its clients, including the current coding-agent conversation, so perform the actual operation from a separate terminal after this work is reviewed. The `--applications-stopped` option is the operator's explicit confirmation; the script does not discover or stop processes automatically.

After the project folder has been renamed, run from the new checkout:

```bash
node src/migrate_conversations.mjs \
  --from /Users/jetienne/webwork/coding_agent_plugin \
  --to /Users/jetienne/webwork/coding_agent_plugins \
  --backup /Users/jetienne/conversation_backup_61 \
  --apply --applications-stopped
```

Choose a new, unused backup directory whose parent exists, outside both project paths and application storage. The backup contains private conversation data. The script saves original changed files, copies moved Claude Code project directories, and records the original affected Codex row fields before changing conversation storage. Unmodified Codex transcripts are not copied by the script; retain the separate full preparation backup as well.

To preview restoration, use `node src/migrate_conversations.mjs --restore /Users/jetienne/conversation_backup_61`. Add `--apply --applications-stopped` to restore. Restoration reverses the conversation metadata migration; restoration does not rename the project folder. Changed rollback targets cause refusal, rather than overwriting newer content. The same backup can recover an interrupted migration when the only intervening changes belong to that migration.

Use `--only codex` or `--only claude` to select one application. `--codex-home`, `--claude-home`, and `--claude-config` select explicit stores for disposable tests or custom installations. The default homes honour `CODEX_HOME` and `CLAUDE_CONFIG_DIR`. `--help` lists the options. A second migration preview after a completed migration reports no remaining changes for the old path.

### What the script changes

- Codex: only the selected `threads.cwd` and serialized `threads.sandbox_policy` fields in `state_5.sqlite`. Transcript filenames, transcript bytes, message text, titles, archive status, and paginated history stay unchanged. Preserving transcript bytes matters because paginated history stores transcript byte positions.
- Claude Code: move complete project directories, including their memory files and subagent transcripts; update top-level conversation `cwd` metadata, known session-index path fields, project paths in command history, and project keys in the global configuration. Historical message contents and memory file contents stay unchanged. Existing project configuration values move with their project key, without rewriting embedded command lines.
- Other settings: Codex project trust configuration, Codex memories, absolute paths embedded in instructions or commands, desktop applications, editor integrations, and Git worktree administration are outside the script's scope. Use the preparation and Git worktree instructions below for those checks.

The script refuses conflicting Claude Code destinations instead of merging histories. Unknown Codex database versions, unindexed Codex conversations, mismatched session identifiers, symbolic links in selected storage paths, ambiguous Claude Code directory names, incomplete records, and changed migration targets cause refusal. Claude Code project names encode different punctuation with the same character, so transcript or configuration paths must establish which project a directory belongs to. Fix the reported condition before retrying; do not force a bulk replacement.

### Script validation

Seven automated storage tests cover a five-conversation batch, archived and nested Codex conversations, unrelated path prefixes, byte-preserved messages and Codex transcripts, destination conflicts, incomplete records, unsupported schemas, symbolic links, ambiguous project names, changed targets, interrupted migration rollback, and required apply options. Run `pnpm test` and `pnpm check` from the checkout containing the script.

The finished script was also applied to populated disposable copies of the earlier real conversations, with the selected application stores stopped. Raw summary:

```text
2 conversations; 1 files; 1 Claude Code project directories; 1 Codex index rows.
Migration complete. Rollback backup: /private/tmp/conversation-recovery-61/batch-backup
```

Codex 0.167.0 then displayed `Create amber marker file` in the ordinary new-directory picker. Selecting the conversation retained its earlier context. A new request wrote `amber` to `script-check.txt` under `/private/tmp/conversation-recovery-61/batch-after/codex`.

Claude Code had automatically updated from 2.1.319 to 2.1.322 during this investigation. Version 2.1.322 displayed `Disposable folder-rename test` in the migrated directory's picker and loaded the earlier conversation. That isolated storage copy had no authentication, so a separate newly identified disposable copy of the migrated transcript was opened with normal Claude Code authentication to check continuation. A new request wrote `731` to `script-check.txt` under `/private/tmp/conversation-recovery-61/batch-after/claude`. This distinguishes picker/storage validation from the separately authenticated continuation test.

An earlier Codex storage experiment renamed a transcript to `test.jsonl` and failed with `does not have a canonical rollout filename`. The finished script never renames or rewrites Codex transcripts. An index-only experiment with an exact transcript copy and matching paginated history successfully resumed and wrote `amber` in the new test directory before the script was applied.

## Scope

Jérôme clarified that no folder has already been affected. The intended rename is `/Users/jetienne/webwork/coding_agent_plugin` to `/Users/jetienne/webwork/coding_agent_plugins`. Only Codex and Claude Code command-line applications are required. The real repository has not been renamed.

The single assumption tested was whether a real existing conversation could retain an earlier fact and perform file operations in the renamed directory. Tests used the installed interactive terminal applications, normal user session storage, actual model responses, and populated disposable folders. Codex used its normal shared background server. Print mode, fabricated transcripts, and replacement transports were not used.

## Results on 10 November 2026

| Application | Recovery | New-directory discovery |
| --- | --- | --- |
| Codex 0.167.0 | Same session identifier with explicit `--cd`: context and relative file writes worked. | After restart, the new-directory picker showed the conversation; selecting the conversation and writing another file worked. |
| Claude Code 2.1.319 | Same session identifier from new directory: context and relative file writes worked. | Initially absent after restart. `/cd` through a temporary directory and back moved the transcript to the new project storage; the restarted picker then displayed the conversation. |
| Desktop applications and editor integrations | Not tested. | Outside the selected scope. |

These results establish individual supported manual recovery. Automatic migration of every conversation, project memory, permissions, configured paths, and linked worktrees is not established. Default picker behaviour immediately after the rename, before manual recovery, was not captured. Restart means the terminal application process; the shared Codex server was not restarted.

## Prepare before the real rename

1. Record each required conversation's application, session identifier, title, original absolute directory, and a fact for checking retained context. Record conversations from worktrees separately. Keep the inventory outside the renamed folder.
2. Finish or stop all affected work and exit affected applications. A Codex terminal disconnect can leave background work running; check `codex agents` first.
3. Make a dated private backup outside both project paths, including hidden project files, actual session stores, memories, and configuration. Default locations include `~/.codex`, `~/.claude`, and `~/.claude.json`; include custom locations when configured. Stop writers before copying, preserve file permissions, and verify the backup can be read and its checksums match. Do not place transcript backups inside `~/.claude/projects`: duplicate identifiers can prevent cross-project lookup.
4. Save `git worktree list --porcelain`. At investigation time this repository had a nested linked worktree for this issue. Complete and remove temporary workflow worktrees before the real rename where possible; inventory old and new paths of any retained worktrees.
5. Inventory memory files, saved project trust and permissions, absolute paths in configuration, launch commands, installed skill links, and workspace references. Conversation recovery does not verify these separately stored settings. Do not replace paths indiscriminately in transcripts or configuration.
6. Rename only after preparation. This investigation does not perform the real rename or migrate existing repository conversations.

## Recover Codex conversations

After the rename, replace `SESSION_ID` with each recorded identifier:

```bash
codex resume SESSION_ID --cd /Users/jetienne/webwork/coding_agent_plugins
```

If an identifier is missing, the documented `codex resume --all` picker searches across directories. Choose the intended conversation and explicitly select the new working directory. That discovery fallback was not exercised in this test.

Ask for the earlier fact without repeating the fact, run `pwd`, and ask for a relative write to a uniquely named verification file. Check the file exists under the new directory and the old directory was not recreated. Exit, restart from the new directory, open `codex resume`, select the conversation, and repeat a file operation. Repeat per conversation and worktree.

## Recover Claude Code conversations

After the rename:

```bash
cd /Users/jetienne/webwork/coding_agent_plugins
claude --resume SESSION_ID
```

Verify context and relative file operations as above. In the tested version, this resumed correctly but left the conversation outside the new-directory picker. `/cd` to the current directory returned `Already in` without relocating storage.

For that case, create an empty temporary directory outside the repository. Inside the resumed conversation, run `/cd` to the temporary directory, then `/cd` back to the new project directory. Confirm trust only for the directory created for this test. Retain the backup first: these commands relocate this conversation. Do no unrelated work in the temporary directory.

The disposable test used:

```text
/cd /private/tmp/conversation-recovery-61/claude-transfer
/cd /private/tmp/conversation-recovery-61/claude-after
```

After returning, verify the remembered fact and file operations, exit, restart `claude --resume` in the new project, and check discovery and resume again. The documented Control+A picker searches all projects if needed. Do not hand-copy transcripts into another active project store. Repeat per conversation. Check project memory and saved permissions separately.

## Linked Git worktrees

A disposable Git repository with a nested linked worktree reproduced broken administration paths after the parent folder moved. Repair succeeded with:

```bash
git -C /private/tmp/conversation-recovery-61/git-after worktree repair /private/tmp/conversation-recovery-61/git-after/linked
git -C /private/tmp/conversation-recovery-61/git-after/linked rev-parse --show-toplevel
```

For the real rename, use the new main checkout and each retained worktree's recorded new path. Verify `git status` and `git worktree list --porcelain` in every retained checkout. Do not edit Git administration paths with bulk replacements.

## Rollback

Stop affected applications and preserve the failed state and newer conversations first. Rename the project back only if the old path is unoccupied and newer work will not be overwritten. Repair retained Git worktree paths for the restored location. Restore session/configuration backups only with writers stopped, after preserving changes since backup: a whole-store restoration can discard newer conversations. Resume by recorded identifiers and verify context and file paths again. Backup restoration was not exercised against real user storage.

## Local evidence

Disposable root: `/private/tmp/conversation-recovery-61`. Project paths ended in `codex-before` and `claude-before`, then were renamed to `codex-after` and `claude-after` after the initial conversations exited. Both initial conversations created `marker.txt`. Recovery prompts asked for the earlier fact without repeating the value.

Codex session: `01a1c4a0-f7ba-7b90-b3f9-7ab19925deeb`.

```text
codex-cli 0.167.0
Created marker.txt containing amber. The observatory colour is amber.
Absolute working directory: /private/tmp/conversation-recovery-61/codex-before
[resume by identifier with --cd .../codex-after]
The observatory colour is amber. Wrote amber to recovered.txt.
pwd returned: /private/tmp/conversation-recovery-61/codex-after
[restart picker from new directory]
Filter: Cwd
Create amber marker file
1 / 1
```

After selecting the restarted picker entry, another request created `restart.txt` containing `amber` under `codex-after`.

Claude Code session: `76894d3e-b48e-4b5f-a391-aa1c4bf59884`.

```text
2.1.319 (Claude Code)
[initial file operation]
/private/tmp/conversation-recovery-61/claude-before
731
[resume by identifier from .../claude-after]
You asked me to remember the harbour number 731.
I wrote 731 to recovered.txt. The pwd command returns
/private/tmp/conversation-recovery-61/claude-after.
[restart picker in renamed folder]
No conversations found in this project.
Ctrl+A to show all projects
[/cd to current folder]
Already in /private/tmp/conversation-recovery-61/claude-after.
[/cd through temporary directory and back]
Moved to /private/tmp/conversation-recovery-61/claude-transfer
Moved to /private/tmp/conversation-recovery-61/claude-after
[verification after moves]
I wrote 731 to restart.txt. The pwd command returns
/private/tmp/conversation-recovery-61/claude-after.
```

After exiting and restarting `claude --resume` from `claude-after`, the picker displayed `Disposable folder-rename test`. Selecting the entry loaded the earlier conversation; a new request wrote `final-check.txt` containing `731` in `claude-after`, and `pwd` reported that new directory. The transcript then existed at `~/.claude/projects/-private-tmp-conversation-recovery-61-claude-after/76894d3e-b48e-4b5f-a391-aa1c4bf59884.jsonl`.

Git worktree raw output:

```text
repair: gitdir incorrect: /private/tmp/conversation-recovery-61/git-after/.git/worktrees/linked/gitdir
/private/tmp/conversation-recovery-61/git-after/linked
```

These are selected exact messages and file contents; terminal animation is omitted. The actual repository folder and existing user conversations were not migrated. Script writes and rollback tests used disposable data. Real project-memory migration, permission migration, and backup restoration were not performed.

## Sources and evidence boundaries

[Codex command-line reference](https://learn.chatgpt.com/docs/cli/reference) documents cross-directory discovery and the explicit directory override. [Claude Code sessions](https://code.claude.com/docs/en/sessions) documents cross-project identifier lookup and `/cd` storage relocation. These documentation claims are distinct from the local results above.

The issue links [Codex report 11019](https://github.com/openai/codex/issues/11019) and [Claude Code report 33636](https://github.com/anthropics/claude-code/issues/33636). Those reports are investigation leads, not evidence of current failures in the installed versions. No current behaviour is inferred from those reports.
