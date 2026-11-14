# Representative synthetic rename verification

Procedure defined for [issue #76](https://github.com/jeromeetienne/coding_agent_plugins/issues/76).
This document specifies acceptance before the representative fixture is built. A result is pending until its raw evidence exists. Unit tests alone do not establish acceptance.

## Order and isolation

1. Record installed Node.js, pnpm, Git, Codex, and Claude Code versions, free disk space, operating system, and the source revision as a remote commit link.
2. Prove that both installed command-line clients can create and resume one new conversation in disposable application storage. Give each conversation a unique fact in a nonempty project. Disable inherited project integrations. Check stored identity, transcript, and project association after the first turn and the resumed turn. A version command or an unauthenticated startup does not pass this check. Never copy private history into the disposable stores.
3. Generate the fixture specified below. Independently validate the fixture before invoking rename_agent_project. Save a baseline report before correcting any defect.
4. Run the complete rename and restoration matrix. Correct confirmed failures, then run the identical matrix and resource limits again. Keep baseline and corrected reports separately.
5. Run the real clients against the renamed fixture. Resume by identity and through each client's normal project conversation picker, confirm the unique earlier facts, and write a verification file inside the renamed project. Repeat after restoration. The coding agent performs these checks; the developer does not repeat routine tests.

Use a newly created, mode 0700 directory under `/private/tmp` on macOS or `/tmp` on Linux. Resolve the directory to its real path before passing paths to the tool. All projects, Git repositories, linked worktrees, application stores, operation directories, and logs must remain below this directory. Always pass `--codex-home`, `--claude-home`, and `--claude-config` explicitly. The client environment must select the same disposable stores. Do not change the user's home directory or configuration. Do not terminate existing clients or the shared Codex server. Only terminate process identifiers created by the test runner.

Authentication for disposable stores must use supported client authentication. Do not print credentials or copy configuration containing private history. Failure to authenticate is a blocked application check, not a successful integration result.

## Fixed acceptance fixture

The full acceptance run uses the following minimums. A reduced development run must be labelled reduced and cannot satisfy these targets.

| Dimension | Required target |
| --- | --- |
| Project entries | 25,000 regular files, 2,000 directories including 100 empty directories, and 100 symbolic links |
| Permissions | Nested directories at 0700 and 0500; files at 0600, 0400, 0644, and 0755; verify every mode |
| Links | Relative, absolute, dangling, and links to a separate synthetic sentinel directory; never traverse the sentinel |
| Git | Main repository, two nested linked worktrees, and two external linked worktrees under the disposable root |
| Conversations | 1,000 Codex and 1,000 Claude Code conversations; stable distinct identities and facts |
| Application storage | At least 100 Claude Code project directories and 100 Codex session/archive directories, including unrelated stores |
| Metadata changes | At least 10,000 affected structured path fields and 1,000 unrelated path fields that remain unchanged |
| Transcript bytes | At least 1 GiB of materialized, valid UTF-8 JSON records across both applications |
| Individual transcripts | At least one 160 MiB transcript per application; each exceeds the 64 MiB JavaScript heap limit |
| Record sizes | Varied 256-byte to 256-KiB records and at least ten 1-MiB records; no record exceeds 2 MiB |
| Histories | Alternating user, assistant, tool request, tool result, Unicode, escaped newlines, and repeated structured paths |
| Special associations | Archived, existing destination, missing indexed transcript, unrelated, active review, and completed review |

Fixture version 2 uses canonical UUIDs, Codex dated rollout filenames, complete session metadata, an early user preview event, and native message/function-call/function-result records. Claude Code records use user/assistant messages, tool-use/tool-result content, parent UUID chains, and a completed final assistant turn. Version 1 measurements remain historical evidence and are not labelled version 2 results.

Records contain deterministic varied text, sequence numbers, tool arguments, outputs, unique facts, and checksums. Empty, sparse, zero-filled, or repeated padding files do not count toward transcript targets. Generate incrementally with a fixed published seed. Record actual counts, allocated and logical bytes, maximum record size, and SHA-256 checksums. Keep independent expected identities, field mappings, facts, and paths outside application storage.

## Independent verification

The fixture generator and verifier must not import rename_agent_project's snapshot, hashing, discovery, migration, or verification functions. Use filesystem `lstat`, symbolic link reads, streaming SHA-256, independent JSON record parsing, and read-only SQLite queries. Verify the independent inventory against exact target counts and distributions, not merely against the generator's own summary.

Before rename, independently save project bytes, modes, empty directories, link text, Git worktree locations, transcript modification times, conversation identities and ordered history, unrelated rows, and missing transcript rows. Verify that recent native conversations retain their normal picker position after transcript metadata changes. After rename, verify expected structured path changes while preserving every other field and history order. Compare backup bytes and modes against the original inventory. Verify Git operations from every worktree. After restoration, compare original bytes and associations exactly; separately account for verification turns added by real clients. Newer user work must never be overwritten.

Prove verifier sensitivity by independently corrupting one byte, one permission, one link, one identity, one history record, and one backup in separate copies. Each corruption must fail the appropriate check. Reproduce the private nested directory failure, missing transcript handling, completed review handling, destination conversation preservation, and unexpected worker exit reporting from issues #70, #71, #73, and #75. Record the exact defect exercised; do not infer reproduction from a similarly named unit test.

## Commands and evidence contract

From the temporary worktree, install and run the existing baseline:

```bash
pnpm install --frozen-lockfile
pnpm --filter rename_agent_project start --help
pnpm test
pnpm check
```

Run the generator, independent verifier, real command-line rename, and restoration with:

```bash
PATH="/usr/local/bin:$PATH" pnpm --filter rename_agent_project synthetic --profile full --seed issue-76-v2 --evidence /private/tmp/rename-76-full
PATH="/usr/local/bin:$PATH" pnpm --filter rename_agent_project synthetic:faults --profile full --phase all --mode all --evidence /private/tmp/rename-76-faults
```

Each evidence path must be new. The runners create fresh owned fixture roots automatically and print their paths. Use `--profile smoke` for reduced development checks, which do not establish full-scale acceptance. The success runner accepts `--keep` to retain a successful fixture. The fault runner accepts one phase and one mode for reproduction. `--phase all` runs 27 cases; `--phase write-failures` selects the ten finer write-boundary cases, and `--phase concurrent-changes` selects four preservation cases. `--prepare-only --client-template <marked-root>` prepares a fixture containing only allowlisted synthetic native-client histories; the helper never copies authentication. `--fixture <owned-root>` runs a prepared fixture without regenerating its data. Reports and raw logs remain in the evidence directory; failed fixtures remain available for recovery. A nonzero exit or incomplete operation fails the runner; no timeout is a pass.

For each scenario, the runner invokes the real command with this argument structure, substituting absolute paths inside its own root:

```text
pnpm --filter rename_agent_project start --from <root>/project --to <root>/renamed --codex-home <root>/codex --claude-home <root>/claude --claude-config <root>/claude/.claude.json --backup <root>/operation --apply
pnpm --filter rename_agent_project start --status <root>/operation
pnpm --filter rename_agent_project start --status <root>/operation --watch
pnpm --filter rename_agent_project start --restore <root>/operation
pnpm --filter rename_agent_project start --restore <root>/operation --apply
```

Save command arguments, environment variable names (no credential values), versions, wall time, child and worker process identifiers, exit statuses, terminal operation state, peak resident memory for each worker, JavaScript heap limit, inventory, and raw standard output/error. The launching command's exit status alone is insufficient. Confirm the independent worker survives termination of its own initiating test process.

## Required scenario matrix

Run success, refusal, and recovery cases from fresh fixtures. Controlled faults may use injection, but copy, move, database access, worker execution, and client integration use the real filesystem and applications.

| Scenario | Required outcome |
| --- | --- |
| Baseline rename and restore | Complete, independent checks pass, then rolled_back with original bytes and identities |
| Private/read-only nested entries | Copy and verification preserve modes and bytes; cleanup restores traversal permissions only after evidence |
| Existing destination or dangling destination link | Refusal before data changes; destination sentinel preserved |
| Missing indexed transcript | Warning with exact identity/path; missing row unchanged; available histories migrate and restore |
| Existing destination and archived conversations | Both remain discoverable; destination and unrelated histories remain unchanged |
| Active review | Waiting, with no migration writes; completed review permits progress despite stale active child status |
| Concurrent project or transcript change | Refusal or recovery_required; independently verify newer work survives |
| Source recreation or destination appearance | Refusal without overwriting either path |
| Disk write failure | Inject ENOSPC at backup, staging, replacement, journal, and restoration writes; retain recoverable evidence |
| Worker crash | Kill only the test worker before writes and during backup, migration, rename, worktree repair, verification, and restoration |
| Recovery after each crash | Status detects death; no indefinite waiting; lock state matches recovery requirements; checked restore preserves original/newer work |
| Application reopening | Real clients find conversations in normal project pickers and recall facts before/after restoration |
| Process isolation | Unrelated synthetic client stays live; existing clients and shared server remain untouched |

For every crash phase, record the last durable journal state and the exact completed operation after which the fault was injected, before advancing the phase. The implemented fault worker injects after real fs-extra copy/move, Git repair, or conversation verification calls; those boundaries exercise recovery with actual completed writes. These tests do not claim interruption inside a kernel filesystem call or real disk exhaustion. A checkpoint before a phase does not prove that the phase performed any writes. Actual disk exhaustion is optional and separate from injected ENOSPC: never fill the user's volume. Use a bounded disposable filesystem if a real exhaustion check is run.

## fs-extra acceptance

After recording the baseline, install fs-extra as a package runtime dependency and use its exported copy/move operations directly. Remove superseded custom copying code; keep application-specific migration and independent verification separate. Exercise the installed library inside the independent bundled worker against nested modes, links, conflicts, failure, and recovery. Loading the library only in a unit test is insufficient. Preserve the evidence of the baseline defect and rerun the same complete matrix after correction.

## Resource budgets and cleanup

Require at least 8 GiB free before the full fixture and stop generation before free space falls below 4 GiB. Budget at most 3 GiB for one fixture, 6 GiB including backups and staging, 30 minutes per scenario, and two hours for a full matrix; exceeding a budget is a failed or incomplete result with evidence. Run scenarios sequentially and remove completed data between scenarios. Run migration workers with `--max-old-space-size=64`; measure resident memory separately, with a 512 MiB ceiling. Report record size and operation metadata size when investigating excess memory.

On success, save compact reports and logs outside the disposable root, confirm all test workers exited, restore read/write/traversal permissions inside the owned fixture without following links, then delete only the root the runner created. On failure, retain root, journal, backup, logs, and process identifiers. Inspect `--status`, preview `--restore`, then apply restoration only after independent checks show the current state matches recoverable expectations. Never delete a lock to force another operation, overwrite newer files, or reuse an incomplete fixture for another scenario.

## Current evidence

The representative success run passed after the fs-extra correction; baseline failure and measured results are recorded in [SYNTHETIC_RESULTS.md](SYNTHETIC_RESULTS.md). The complete matrix and actual client coverage must be evaluated separately; a success run alone does not close issue #76.

### Isolation attempt, 14 November 2026

Installed clients: Codex 0.169.0 and Claude Code 2.1.323 on macOS. The default shell selected Node.js 22.23.3; package commands must instead use `/usr/local/bin/node` (24.14.0), for example by prefixing the command with `PATH="/usr/local/bin:$PATH"`. pnpm is 10.33.2 and Git is 2.50.1. Initial free disk space was approximately 12 GiB.

A newly created project at `/private/tmp/rename-76-isolation-fln68gxl/project` contained `fact.txt` with the fact `Synthetic isolation fact: copper heron 76.`. Two separate empty application stores were selected through each client's storage environment variable. No authentication or existing conversation files were copied. The actual commands were:

```bash
CODEX_HOME=/private/tmp/rename-76-isolation-fln68gxl/codex codex exec --ignore-user-config --skip-git-repo-check --json 'Read fact.txt and repeat the fact. Do not modify any files.'
CLAUDE_CONFIG_DIR=/private/tmp/rename-76-isolation-fln68gxl/claude claude -p --setting-sources '' --strict-mcp-config --mcp-config '{"mcpServers":{}}' --tools Read --output-format json 'Read fact.txt and repeat the fact. Do not modify any files.'
```

Both commands ran with the disposable project as their working directory. The first Codex attempt reached a 40-second deadline after network lookup failures inside the command sandbox. A network-enabled retry used the same arguments with the prompt `Read fact.txt and repeat the fact. Do not modify files.` and standard input disconnected. The retry exited with status 1. Relevant raw output:

```text
{"type":"error","message":"Reconnecting... 2/5 (unexpected status 401 Unauthorized: Missing bearer or basic authentication in header, url: wss://api.openai.com/v1/responses, cf-ray: a5a60dfd3dd3f0c7-CDG)"}
```

Claude Code exited with status 1. Relevant raw result fields:

```json
{"is_error":true,"num_turns":1,"terminal_reason":"api_error","result":"Not logged in · Please run /login"}
```

Full raw output remains in `codex.log`, `codex-network.log`, and `claude.log` below `/private/tmp/rename-76-isolation-fln68gxl`. These temporary logs are local evidence, not published acceptance artifacts. Neither client returned the fact in this initial attempt. The developer subsequently authorized reuse of account credentials in disposable stores; successful live checks and later representative runs are recorded in SYNTHETIC_RESULTS.md. This failed initial attempt is retained as historical evidence, not as the current gate status.

### Existing-suite baseline, 14 November 2026

Source: [baseline revision](https://github.com/jeromeetienne/coding_agent_plugins/commit/eff797118be7a8f450ec12cd5379b42779f4e021). Commands used `PATH="/usr/local/bin:$PATH"` to select Node.js 24.14.0. `pnpm install --frozen-lockfile`, `pnpm --filter rename_agent_project start --help`, `pnpm test`, and `pnpm check` all exited with status 0. The existing suite reported 45 tests passed, 0 failed, 0 skipped, in 71.711 seconds. Its large individual file test reported peak resident memory of 171,280 KiB. These measurements describe the existing suite only; the representative targets and actual client reopening remain untested. Relative Markdown links resolve and `git diff --check` passes.
