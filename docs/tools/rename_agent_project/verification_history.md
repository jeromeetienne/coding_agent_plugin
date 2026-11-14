# rename_agent_project verification history

- Created: 14 November 2026
- Last updated: 14 November 2026
- Status: Historical verification evidence
- Related framing: [Project rename guide](conversations_after_folder_rename.md)
- Related issue: [Issue 80](https://github.com/jeromeetienne/coding_agent_plugins/issues/80)

For maintainers assessing earlier tests: this record answers what was exercised and what remains unverified. Paths, process identifiers, application versions, and test counts below describe the recorded runs, not the current environment.

## Approved testbed

All development mutation uses synthetic projects and new conversations. The real repository folder and existing user conversations are excluded.

The local application testbed is `/private/tmp/rename_agent_testbed_64`. The original synthetic project was `rename_agent_test_project`. Separate `codex_home` and `claude_home` directories isolate application storage. The project contains synthetic files and a nested linked Git worktree. Three conversations were created through the real Codex terminal application and three through the real Claude Code terminal application, each with a distinct fact and file. Application sign-in was used without copying existing user conversations.

Installed versions tested: Codex 0.167.0 and Claude Code 2.1.322 on macOS.

## Earlier automatic-shutdown evidence

The results in this section describe the earlier implementation. The current implementation replaces automatic shutdown with manual closure of affected clients, as tested in the next section.

Before implementing automatic shutdown, a worker launched from a real synthetic Codex conversation was tested across client shutdown and isolated Codex server shutdown. Selected raw evidence from `control/gate_result.json`:

```json
{"workerPid":51386,"before":1794312661672,"after":1794312671190,"clientExited":true,"isolatedCodexDaemonStopped":true,"workerStillWriting":true}
```

This proves survival of the tested command-line client and its isolated background server. Quitting the complete desktop host was not tested.

The first operation stopped synthetic clients but refused before changing project or conversation data: the copied project root had different permissions. Backup creation was corrected to preserve and verify the root permissions. The failed operation verified the original state.

The next full operation completed with:

```text
state: complete
phase: verified
conversations: 3 Codex, 3 Claude Code
```

The tool renamed the project to `rename_agent_test_project_renamed`, migrated all six associations, and repaired the nested linked Git worktree. Both ordinary conversation pickers were opened from the renamed folder without supplying conversation identifiers or a working-directory override. Each displayed the three expected conversations. Every conversation was selected, recalled its distinct earlier fact without that fact being repeated in the prompt, and wrote a relative verification file in the renamed folder. The original folder was not recreated.

Selected verification file contents:

| Conversation | Remembered fact |
| --- | --- |
| codex-one | amber-731 |
| codex-two | jade-482 |
| codex-three | silver-953 |
| claude-one | cobalt-214 |
| claude-two | violet-628 |
| claude-three | copper-357 |

The testbed retains `control/conversations.json`, `control/first_rename_verification.json`, operation journals, verified backups, and the synthetic application stores for inspection. The evidence describes this six-conversation testbed, not every possible application version or storage configuration.

A further attempt started from a synthetic Codex shell tool under its normal sandbox. The launcher started, but process inspection was denied. The operation recorded `failed: checking-applications` with `Cannot inspect application processes with ps.` before any project or conversation writes.

The same synthetic conversation was reopened with process-inspection permission. The conversation launched another rename, returned immediately, and finished its turn. The independent worker then closed that client and its isolated server and renamed the project again to `rename_agent_test_project_renamed_again`. The journal recorded `complete: verified`, with three conversations for each application. A separate check verified all six identifiers and associations, all six earlier verification files, absence of the old path, and the nested linked worktree. Results are retained in `control/self_initiated_rename_verification.json`. Normal-picker continuation of all six was exercised after the first successful rename; the second rename checked storage associations and existing verification files rather than repeating all six model continuations.

## Shared server kept running and manual client closure

The critical assumption was tested before implementing the new behaviour: selected conversations must migrate and resume while the real shared server and an unrelated real terminal client remain running. Tests used the existing synthetic project and stores, with a new unrelated synthetic project in the same isolated Codex store. The shared server had process identifier 2438 throughout.

The smallest gate manually closed only the affected synthetic client, migrated the six synthetic conversation associations, and renamed the folder. The ordinary Codex picker displayed all three expected conversations. Selecting codex-two recalled `jade-482` and wrote a relative verification file in the new folder. The already-open unrelated client recalled `8642` and wrote in its original folder. The old project path was absent. Raw selected results from `control/shared_server_gate/result.json`:

```json
{"serverPid":2438,"serverStillAlive":true,"normalPickerCount":3,"affectedFact":"jade-482","unrelatedFact":"8642","oldPathAbsent":true}
```

After implementation, the actual revised command ran against the populated synthetic project with both clients still open. Terminal output identified only the affected client:

```text
Waiting for affected clients. Keep the shared server and unrelated clients running.
Close codex client PID 4991 in terminal ttys054 manually.
Keep affected clients closed until the operation completes.
```

While waiting, the original folder existed, the destination did not exist, and project backup had not started. After manually closing that one client, the command continued automatically and reported:

```text
complete: verified
Conversations: 3 Codex, 3 Claude Code.
```

The shared server remained process 2438 and the unrelated terminal client remained open. The synthetic project is now `rename_agent_test_project_manual_close`. The revised operation journal and backups are in `operation_manual_close`. After this rename the normal Codex picker displayed all three expected conversations. Selecting codex-two recalled `jade-482` and wrote `manual-close-check.txt` in the renamed folder; the already-open unrelated client recalled `8642` and wrote `unrelated-final.txt` in its original folder. The same server process remained alive and the nested linked worktree passed its path check. Results are retained in `control/manual_close_verification.json`; the original six-conversation continuation test remains recorded above. Real user project folders and existing conversations were not migrated.

## Automated failure and recovery tests

Run `pnpm test` and `pnpm check` from the repository root. The 23 tests use temporary synthetic storage, not real user conversations. Tests cover complete independent rename and restoration, nested Git worktrees, five injected failure phases, changed targets, unsupported storage, destination conflicts, archived and unrelated conversations, waiting for affected active work, manual client closure, unrelated active work, and verification while unrelated metadata changes.

One recovery test starts a real worker process, stops the worker after the physical rename, kills that worker, and launches restoration from the durable journal. The test verifies the original project and conversation state. Guard tests use explicit process descriptions and synthetic application records. A waiting test makes any shutdown signal fail, checks that affected client instructions exclude unrelated clients, and permits continuation only after simulated manual closure. Those tests do not signal real user applications.

Normal picker discovery and conversation continuation are established by the live testbed above, not by fabricated transcripts in the automated suite. Backup restoration after newer work intentionally stops for review rather than overwriting changed data.
