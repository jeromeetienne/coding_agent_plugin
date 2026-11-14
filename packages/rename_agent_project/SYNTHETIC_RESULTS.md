# Representative synthetic verification results

Evidence for [issue #76](https://github.com/jeromeetienne/coding_agent_plugins/issues/76), measured on 14 November 2026. Read [the procedure](SYNTHETIC_TEST.md) before reproducing a case. No real project rename is recommended by these results.

## Environment and independent fixture

macOS Darwin 25.2.0; Node.js 24.14.0 selected through `/usr/local/bin`; pnpm 10.33.2; Git 2.50.1; Codex 0.169.0; Claude Code 2.1.323 initially and 2.1.325 after its automatic update; fs-extra 11.4.1. Free space before the first full run was approximately 12 GiB. The final fixture seed is `issue-76-v2`; earlier baseline measurements use `issue-76-v1` and remain separately identified.

The independent inventory measured 27,202 project entries, 1,000 affected Codex conversations, 1,000 affected Claude Code conversations, 1,182,090,138 transcript bytes, 15,596 affected path fields, and 20 records over 1 MiB. Maximum record size was 1,066,443 bytes. Allocated transcript storage was 1,203,630,080 bytes. Every application has an individual materialized transcript over 160 MiB. The project includes private and read-only nested directories, varied file permissions, 100 symbolic links, empty directories, two nested Git worktrees, and two external Git worktrees within the disposable root.

During final review, the oracle was strengthened to compare exact restored Claude Code bytes as well as normalized history. A deliberate leading-space change keeps valid JSON and identical messages but now fails restoration verification. Earlier reports checked Claude Code history semantics; the final native-client round trip uses the additional exact-byte check.

The oracle uses independent filesystem inspection, Node.js streaming SHA-256, readline parsing, and read-only SQLite queries. The oracle imports no rename implementation. A separate test deliberately corrupts file bytes, permissions, a symbolic link, an identity, transcript history, and a backup; the oracle rejects all six and accepts the repaired fixture.

## Baseline and correction

| Case | Result | Evidence directory |
| --- | --- | --- |
| Existing tests before changes | 45 passed; TypeScript checking passed | Recorded in the procedure |
| Final regression suite | 49 passed in 145.133 seconds after the timestamp correction; TypeScript checking passed | `/private/tmp/rename-76-timestamp-final-tests.log`, `/private/tmp/rename-76-timestamp-check.log` |
| Unchanged implementation, reduced fixture | Failed backup verification | `/private/tmp/rename-76-baseline-smoke` |
| Unchanged implementation, full fixture | Failed backup verification | `/private/tmp/rename-76-baseline-full` |
| fs-extra correction, reduced fixture | Rename and restoration passed independent checks | `/private/tmp/rename-76-corrected-smoke-2` |
| fs-extra correction, full fixture | Rename and restoration passed independent checks | `/private/tmp/rename-76-corrected-full` |
| Reduced failure matrix after recovery correction | All 13 cases passed | `/private/tmp/rename-76-faults-smoke-2` |
| Original full failure matrix | All 13 cases passed before the metadata correction | `/private/tmp/rename-76-faults-full/results.json` |
| Final version 2 success | Rename and exact restoration passed independent checks | `/private/tmp/rename-76-final-v2-full` |
| Final version 2 reduced failure matrix | All 27 cases passed; repeated with stricter exact-byte checks, all 27 passed again | `/private/tmp/rename-76-final-exact-byte-smoke-matrix/results.json` |
| Final version 2 full failure matrix | All 27 cases passed | `/private/tmp/rename-76-final-v2-full-matrix/results.json` |

The first corrected reduced run exposed a verifier-only mismatch between SQLite objects with null prototypes and ordinary expected objects. The oracle now compares row values using ordinary objects. That verifier correction did not change rename behavior.

The unchanged copy implementation changed nested directory permissions:

```text
private mode 0o700 -> 0o755
private/readonly mode 0o500 -> 0o755
failed: backing-up-project
Project contents changed: <fixture>/operation/project
```

Installed fs-extra copy/move operations now perform project and storage copies and directory moves directly. The independent bundled worker contains the installed dependency, with Node.js CommonJS loading support. Atomic checked transcript replacement still uses filesystem rename after fs-extra creates the temporary copy; fs-extra's overwrite move would unlink the target first, so that operation is intentionally not substituted for atomic replacement.

The final version 2 success run completed in 239.843 seconds including generation and independent checks. Generation took 18.340 seconds; rename took 124.235 seconds and restoration took 53.467 seconds. Both the launcher and independent worker used a 64 MiB JavaScript heap. Sampled peak worker resident memory was 304,768 KiB for rename and 277,376 KiB for restoration. Sampling was every 100 milliseconds, so these are observed maxima rather than guaranteed instantaneous peaks. Reports contain exact arguments, process identifiers, exit codes, and timings.

## Codex picker defect found through the actual client

A real conversation created directly in the large disposable project appeared in the normal Codex project picker before rename, but disappeared after an operation reported complete. The SQLite association had moved while the first rollout metadata record still contained the original working directory. Changing only that metadata working directory made the same conversation reappear; the selected conversation recalled its earlier fact and wrote the expected verification file.

Migration now maps the first `session_meta.payload.cwd` to the indexed association. A bounded header rewrite streams every later transcript byte unchanged, including historical records containing old paths. The independent oracle checks the header association separately from an exact hash of all later bytes. Restoration verifies the original complete transcript checksum. The final version 2 large success run includes this correction.

## Recovery defect found by the new tests

A real test worker was killed after Git worktree repair returned, while the durable phase still said `repairing-worktrees`. The next restoration worker overwrote that phase during startup and idle checks, then compared repaired Git metadata against the earlier snapshot and refused recovery. The reduced failure runner recorded the failure in `/private/tmp/rename-76-faults-smoke`.

Recovery now retains the original interrupted phase across status inspection and restoration startup. Restoration also repairs worktrees when the project has already been moved back by an interrupted restoration. All 13 reduced cases then recovered with independently verified bytes, permissions, links, histories, identities, and functioning worktrees.

The fault runner uses separate processes and injects one SIGKILL or ENOSPC exception after a real fs-extra copy/move, Git repair, or conversation verification returns. The recorded boundary identifies the state actually exercised. These checks prove recovery at those boundaries. They do not prove behavior inside an interrupted kernel copy, during a partial low-level write or on a physically full disk. Additional cases now inject failures while staging replacements, after atomic replacement, after moving application storage, before a real journal write, and after a restoration replacement. These boundaries are recorded explicitly; journal failure is not simulated as a successful write.

## Live application and terminal checks

Initial live tests used newly created synthetic conversations and disposable application stores under `/private/tmp/rename-76-isolation-fln68gxl`. Existing private conversations were not copied. Account credentials were reused only after explicit developer approval; credentials are excluded from logs and published evidence.

Both installed clients created a conversation, read a unique fact, then resumed the same identity and returned the fact while its source file was hidden. Both command-mode conversations also resumed and recalled their history after a real rename of the small disposable project. These are narrower checks than the large generated storage fixture.

Normal project pickers excluded command-mode conversations in this environment. Separate interactive conversations were therefore created using the actual terminal clients. After another rename, the normal Codex picker displayed `Remember synthetic fact` and the normal Claude Code picker displayed `Amber badger 76`. Both conversations were selected through those pickers and wrote the correct earlier facts into `codex-final-verification.txt` (`violet otter 76`) and `claude-final-verification.txt` (`amber badger 76`) in the renamed project without reading files. Raw terminal recordings remain in `codex-picker-final.log` and `claude-picker-final.log` under the isolated root.

The progress display was exercised in a real terminal while an affected tool-owned Claude Code client was still open. The worker waited, reported the affected client, and continued after that client closed. The terminal recording `progress.log` includes:

```text
| Starting worker | elapsed 0m 00s
/ Checking applications | elapsed 0m 00s
- Waiting for affected clients to close | elapsed 0m 01s
| Backing up and migrating conversations | elapsed 2m 48s
/ Checking and moving the project | elapsed 2m 49s
complete: verified
```

The indicator uses the current phase and elapsed time; no unmeasured completion percentage is displayed. Redirected output receives one log line per phase. Existing user clients and the shared server are never sent shutdown signals.

Two earlier failed Codex authentication/network probes left orphaned turns in the disposable storage. Those two failed synthetic probe identities and their transcripts were removed from that disposable fixture after preserving their raw logs. The successful live conversations were preserved. That cleanup is not evidence that the rename tool can resolve arbitrary orphaned Codex turns.

## Actual review and generated history checks

Codex 0.169.0 performed two actual `codex review --uncommitted` runs in the large disposable project. The production idle check refused while the second review was active, naming the actual affected conversation. After exit status 0, the same check accepted the completed review even though an actual child record still said `inProgress`; its root record said `completed`. Reports and raw command output are in `/private/tmp/rename-76-native-full-prepare/actual-review-active-second.json`, `actual-review-completed.json`, and `actual-review-second.log`. The test did not manufacture review rows or stop the shared server.

Claude Code 2.1.325 also resumed generated version 2 conversation `ad88c64b-35c7-40ec-82cc-938a661c21e3` and returned its recorded fact `issue-76-v2: ad88c64b-35c7-40ec-82cc-938a661c21e3.` without tools. This is a reduced fixture compatibility check; the final large fixture still requires post-migration client checks.

## Final native-client representative round trip

The final version 2 fixture adds one allowlisted native conversation per application to the 2,000 generated conversations. Independent inventory measured 1,182,364,764 transcript bytes, 15,621 changed fields, and 27,202 project entries. The full rename and exact restoration passed in 245.564 seconds. Rename took 123.902 seconds with sampled peak worker resident memory 339,408 KiB; restoration took 54.156 seconds with 265,440 KiB. Both used a 64 MiB JavaScript heap. Reports are in `/private/tmp/rename-76-final-native-full`.

In the restored project, the normal Codex picker selected generated conversation `fccaef8f-9dfb-485e-84c4-5151dacca30d`. Codex recalled the full hash from the first original tool result and wrote `restored-codex-history.txt` without reading files. The hash matched the independent generator expectation exactly. The native Claude Code conversation resumed by identity, recalled `amber badger 76`, and wrote `restored-claude-native-fact.txt` in the restored project.

Claude Code also selected and rendered generated full conversation `f9d33684-9f0c-4da9-8820-162ce9a9e178` through its normal picker. Sonnet 5.5 rejected the tool-result hash recall prompt and a subsequent final-fact prompt with `reasoning_extraction`; no verification file was produced for that generated conversation. These are failed model-recall probes, not successful integration results. Native conversation recall is recorded separately. No model change or attempt to bypass the service safeguard was made.

The verified first operation backup was removed only after preserving its original inventory, journal, worker log, and migration manifest externally. A new independent inventory includes the clients' added turns and verification files before the final rename, so those changes are preserved rather than discarded to make restoration pass.

## Conversation ordering defect found in the final picker check

The allowlisted native Claude Code conversation resumed correctly by identity but was absent from the normal picker's first 50 results after migration. Rewriting every affected transcript had reset modification times, changing which conversations the picker loaded. A minimum actual-client test changed only that synthetic transcript's modification time; independent SHA-256 checks confirmed identical bytes, and the next normal picker immediately displayed `Amber badger 76` first. The original and changed timestamps and hashes are recorded in `claude-picker-mtime-probe.json`.

Checked atomic replacements now retain each live file's access and modification times, and original file backups preserve timestamps. The existing batch migration test asserts exact modification-time preservation for Codex and Claude Code after both migration and restoration. The same already generated large fixture is reused for the corrected rename, with an independent inventory of all transcript modification times. The earlier 27-case full matrix predates this timestamp-only correction; the regression suite and focused representative check are repeated rather than repeating that hour-long matrix.

## Final verified scope and limits

The corrected large rename passed independent data verification and all 2,004 transcript modification-time checks. Maximum timestamp difference was 0.501 milliseconds, within the documented one-millisecond tolerance for JavaScript date precision. Without adjusting timestamps after the corrected rename, both normal project pickers displayed the native conversations. Both conversations were selected through those pickers and wrote the correct earlier facts into `timestamp-codex-fact.txt` (`violet otter 76`) and `timestamp-claude-fact.txt` (`amber badger 76`) in the current project without reading files. See `timestamp-independent-result.json`, `final-client-results.json`, and the terminal snapshots under `/private/tmp/rename-76-final-native-full`.

The 27-case large recovery matrix passed before the final timestamp correction. The 27-case reduced matrix also passed with stricter restored-byte checks. After the timestamp correction, all 49 regression tests, the focused timestamp restoration assertions, TypeScript checking, the reused large-fixture rename, and native conversation picker/history checks passed. The hour-long large matrix was not repeated for this timestamp-only correction. Fault-worker resident memory peaks use each faulting process's own resource usage; recovery workers enforce the same heap limit but were not separately sampled for resident memory.

Generated full Claude Code history was opened and rendered, but its model-recall probes were rejected by the service as recorded above. Native Claude Code history recall passed on the representative fixture. Linux, physical disk exhaustion, and interruption inside kernel filesystem calls are not claimed. Existing clients and the shared server were not stopped.

These measurements were recorded in the temporary worktree before commit and review. The evidence issue records the test outcomes; subsequent commit, merge, and issue closure are tracked separately.

## Terminal display follow-up

A later user screenshot showed concatenated progress frames and repeated completion warnings. Progress output now uses explicit cursor-column positioning and is bounded to one terminal row; completion omits warnings already printed in the foreground command. Two focused command-line tests, TypeScript checking, and an actual 45-column disposable terminal rename passed. All 24 progress frames stayed within 44 columns and the missing-transcript warning appeared once. The user's application rendering has not been independently observed after the correction.

- https://github.com/jeromeetienne/coding_agent_plugins/issues/85#issuecomment-6881474218
