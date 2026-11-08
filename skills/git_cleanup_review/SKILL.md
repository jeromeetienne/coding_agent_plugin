---
name: git_cleanup_review
description: Review Git branches and worktrees and advise which ones appear safe to remove, with evidence and uncertainty. Use when a developer asks to audit, review, or identify cleanup candidates. This skill gives advice only and does not remove anything.
---

# Git Cleanup Review

Review branches and worktrees and explain which ones appear safe to remove. A worktree is a separate working folder connected to the same Git repository. The default action is advice only. Never remove a branch or worktree as part of an audit. A later, separate request to remove an item is required before taking that action.

## Choose the destination branch

Read the repository instructions and identify the branch where completed work is expected to land. Use the developer's named destination when supplied. Otherwise, use the repository instructions or branch configuration when they make the destination clear. If there are several reasonable choices, ask which destination to use before judging whether work is included. State the destination branch in the report.

## Exclude protected checkouts and branches

Always keep the main checkout of the repository, including when the review runs from a linked worktree. Identify the main checkout from `git worktree list --porcelain`; the main checkout is the first entry. Do not assume that the current working directory is the main checkout.

Always keep branches named `main`, `master`, or `dev`, including their remote counterparts such as `origin/main`. Read repository instructions for additional branches that must be kept. These protections apply even when all commits are included in the destination branch. Never list the main checkout or these protected branches as removal candidates. If protected items appear in the report, label them **Keep** and explain the protection.

Include the current branch and any branch used by an active worktree in the report.

## Collect the evidence

Start with read-only Git commands:

```bash
git status --short --branch
git worktree list --porcelain
git branch --all --verbose --verbose --no-abbrev
```

For each local branch and each worktree, inspect the relevant branch and directory. Do not treat a worktree and its branch as one decision: a worktree can have local files to preserve even when its branch's commits are included, and a branch checked out in a worktree cannot be removed while that worktree remains.

For a worktree, inspect its full path with:

```bash
git -C <worktree-path> status --short --branch --untracked-files=all
git -C <worktree-path> submodule status --recursive
```

Look for staged changes, unstaged changes, untracked files, and submodule changes. If a submodule is present, inspect its working directory as well. If a worktree cannot be read, its state is unknown.

For a branch, compare its commits with the destination branch. First check whether its tip is already part of the destination branch's history. If it is not, inspect the commits that differ and compare their changes:

```bash
git merge-base --is-ancestor <branch> <destination>
git log --oneline --decorate <destination>..<branch>
git cherry <destination> <branch>
```

An unmerged commit list alone does not prove that work is missing: a change may have reached the destination through a squash (combining several commits into one) or another equivalent commit. In `git cherry` output, `-` means Git found an equivalent change in the destination, and `+` means it did not. Inspect the differing commits, including commits that combine two or more earlier lines of work, and report any uncertainty. Commit comparison cannot prove that two changes have the same purpose or effect in every case.

For remote branches, distinguish the branch on the remote server from the local reference that records the last known remote state. That local reference may be stale. When network access is available, `git ls-remote --heads <remote>` can check which branch tips currently exist on the remote without updating local references. If the remote cannot be checked, or the needed commit is not present locally for comparison, mark the result as needing inspection. When available, check whether a branch has an open pull request or merge request and whether the remote protects the branch. If these facts cannot be checked, say so. Do not fetch or prune as part of the default audit.

## Collect last modification dates

Always include a last modification date for every branch and every worktree listed in the results, including items marked **Keep**. Use a full date and time with a time zone, and explain what each date measures.

For each branch, collect the committer date of the latest commit with:

```bash
git log -1 --format=%cI <branch>
```

Label this value "Last modification (latest commit)". Git does not provide a reliable last branch-reference modification date for every local and remote branch; the latest commit date does not establish when the branch was created, reset, or updated on the remote. If the commit is unavailable, show "Unknown" and explain the missing evidence rather than omitting the date.

For each worktree, inspect filesystem modification times of the worktree's files and directories, including untracked and ignored files. Include the worktree root, exclude Git administrative entries such as `.git`, and do not follow symbolic links outside the worktree. Report the latest observed modification time as "Last modification (worktree files)". The worktree root directory's timestamp alone does not capture edits to existing files. If part of the worktree cannot be inspected, label the result incomplete; if no date can be established, show "Unknown" with the reason. Explain that filesystem timestamps do not establish a complete history of edits or deletions.

Do not use either date alone as evidence that removal is safe.

## Give separate recommendations

Report local branches, remote branches, and worktrees in separate rows. Apply the protected checkout and branch rules before considering removal candidates. For each row, give one recommendation:

- **Deleteable**: the available evidence shows that no work needs preserving, the branch is not protected, and any branch is not checked out in a remaining worktree.
- **Keep**: there is unique work, a local change, a protected-branch rule, or another clear reason to retain the item.
- **Needs inspection**: evidence is missing, remote information may be stale, a worktree cannot be inspected, or commit equivalence is uncertain.

For every recommendation, state the evidence in plain words. For a worktree, report its last modification date, path, branch or detached state, local changes, and whether its commits are included in the destination. For a branch, report its last modification date, whether its commits are included, whether it is checked out, whether it is protected, and whether its remote state was checked. Do not call an item deleteable just because its branch name is old, its pull request is closed, or its latest commit looks familiar.

Finish with a short note that the report is an assessment of the state observed at that time. Do not run branch deletion, worktree removal, remote deletion, pruning, or cleanup commands during the audit.
