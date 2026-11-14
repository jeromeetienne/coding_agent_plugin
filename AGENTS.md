# Agent instructions

This repository holds the skills for coding agents. Read [CONTEXT.md](CONTEXT.md) for the purpose and the rules of the repository.

## Codex voice mode

- Speak very slowly when using voice mode.
- When enumerating, present only one item at a time. After each item, ask for confirmation before continuing to the next item, and wait for the user's confirmation.

## The Rules of the Repo

Before every change of this repository, follow the skill [rules_of_the_repo](skills/rules_of_the_repo/SKILL.md): read the rules list, and obey each rule skill that applies to the change, with its configuration.

- Rules list: [.agents/rules_of_the_repo/rules_list.md](.agents/rules_of_the_repo/rules_list.md)

## Issue Fix Workflow

Every issue fix in this repository follows the skill [issue_fix_workflow](skills/issue_fix_workflow/SKILL.md). Read the skill before starting an issue fix.
The skill reads the repository-specific values below.

### Issue Fix Workflow values

- Target branch: `main`.
- Worktree creation command: from the main checkout, run `git fetch origin main`, then `git worktree add -b <branch-name> .agents/worktrees/<branch-name> origin/main`. Replace `<branch-name>` with the temporary branch name for the issue or group.
- Worktree folder: `.agents/worktrees/<branch-name>` in the main checkout of this repository.
- Launch command: there is no application to launch. For the conversation script, run `pnpm --filter rename_agent_project start --help`, `pnpm test`, and `pnpm check` from the temporary worktree. Review changed Markdown and verify relative links from the temporary worktree.
- Issue tracker commands: use the commands below with `--repo jeromeetienne/coding_agent_plugin`. Write multiline descriptions and comments to temporary files and pass them with `--body-file`.
  - Read an issue: `gh issue view <number> --json title,body,comments,state,url`.
  - Comment on an issue: `gh issue comment <number> --body-file <file>`.
  - Create an issue: `gh issue create --title <title> --body-file <file>`.
  - Create a pull request: `gh pr create --base main --head <branch-name> --title <title> --body-file <file>`. Push the temporary branch with `git push -u origin <branch-name>` first.
  - Merge a pull request: `gh pr merge <number> --squash`.
  - Close an issue: `gh issue close <number>`.
- Chat rename: use `mcp__codex_tui__set_thread_title` to name the chat after the issue or batch and its subject. If the tool is unavailable in the current agent, report that limitation and continue.

## Issue Batch Workflow

A batch of related issues (one parent issue with two or more sub-issues) follows the skill [issue_batch_workflow](skills/issue_batch_workflow/SKILL.md), in place of the Issue Fix Workflow. Read the skill before starting a batch. The skill uses the section "Issue Fix Workflow values" above.

## Issue Creation

Before creating an issue, attaching an image to an issue, or writing an issue body or comment, read and follow [issue_creation](skills/issue_creation/SKILL.md). Use the GitHub commands configured above. This skill needs no additional configuration.

## Git Cleanup Review

For a review of worktrees and Git branches, read and follow [git_cleanup_review](skills/git_cleanup_review/SKILL.md). The destination branch is `main`; distinguish local `main`, `origin/main`, and the live remote branch when reporting evidence. This skill gives advice only and needs no additional configuration.
