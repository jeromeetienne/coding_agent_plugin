---
name: pull_request_creation
description: Create or update a GitHub pull request with a concrete title, an evidence-based description, and verification of the published result. Use when opening a pull request or rewriting its title or description.
---

# Pull Request Creation

Write for a reviewer who has not read the conversation. Explain the problem, the resulting behavior, and the evidence needed to assess the change.

## Establish the change

Read the repository instructions and pull request template. Establish the repository, destination branch, source branch, and requested action from the request and repository configuration. Resolve conflicting evidence before publication.

Inspect the complete difference against the destination branch, the included commits, and the working tree. A description based only on the latest commit or the conversation can omit changes. Identify unrelated changes before publishing; do not include unrelated local work. Check whether a pull request already exists for the source branch before creating another.

Respect the repository's implementation and review workflow. This skill does not authorize implementation, committing unreviewed work, merging, deployment, or issue closure. A request to create a pull request authorizes publication of the intended branch, subject to repository instructions and existing approvals.

## Write the title

Name the concrete outcome in plain language. Prefer “Preserve document history when moving a document” to “Improve document handling”. Avoid “Updates”, “Various fixes”, and lists of filenames. Follow the repository's title convention when present.

## Write the description

Lead with the problem and resulting behavior. Explain the trigger and before/after behavior when helpful. For documentation or skill changes, name the missing guidance and what the new guidance enables.

Scale detail to complexity. A small change usually needs one or two sentences and relevant validation. Use headings and lists when they help a reviewer assess a larger change or when the repository template requires them. Remove unused template sections unless the repository requires those sections.

Include the following information when relevant:

- Material changes and why the approach solves the problem. Explain meaningful tradeoffs; do not narrate every edited file.
- Related issues and required follow-up work. Use an automatic issue-closing reference only when the change resolves the issue and closure is intended. Distinguish partial work from completed work.
- Validation actually performed, including commands or manual steps, results, and material limitations. Distinguish passing checks, failing checks, and checks not run. A Markdown check does not establish runtime behavior; a local test does not establish deployment success.
- Screenshots or recordings when a visual change benefits from comparison, labelled with what the reviewer should observe. Do not claim visual review without visual review.
- Compatibility changes, migrations, configuration changes, or deployment requirements that affect adoption. State unresolved failures and supported risks that affect the review.

Never invent test results, performance gains, user impact, screenshots, or issue references. If no automated test applies, explain the relevant manual verification. Avoid generic risk checklists.

Use exact established project names. Link repository files when describing specific implementation details, using the source branch for new files. Render every mentioned commit as a link to the commit. Do not add agent attribution, promotional text, conversation history, abandoned approaches, or generation-process commentary.

When scope changes, rewrite the title and description around the final change. Preserve required template fields, reviewer notes, and human-authored information when updating an existing description.

### Example

For an illustrative document move change:

```markdown
Moving a document previously created a new document and lost access to the original history. The move now preserves the document identity and history while updating the document path.

Validation: the document move tests pass, including a move followed by a history lookup. Cross-notebook moves remain outside this change.
```

Replace the illustrative behavior and validation with evidence from the actual change.

## Publish and verify

Use the repository's configured commands and explicit repository selection. On GitHub, use an authenticated `gh` command. Write multiline descriptions to a temporary UTF-8 file and pass `--body-file` to preserve literal text and newlines.

After required workflow checks, commit and push only the intended work when authorized. Create the pull request with explicit destination and source branches:

```bash
gh pr create --repo <owner/repository> --base <destination-branch> --head <source-branch> --title '<title>' --body-file <description-file>
```

For an existing pull request, use `gh pr edit <number> --repo <owner/repository> --title '<title>' --body-file <description-file>` for the requested update. Preserve an existing draft status; use a draft for new work that is intentionally unfinished or when requested.

Read back the published result with `gh pr view <number> --repo <owner/repository> --json url,title,body,baseRefName,headRefName,isDraft,state`. Confirm the title, description, branches, and draft status. Compare the published file list from `gh pr diff <number> --repo <owner/repository> --name-only` with the intended change. If publication times out or returns an uncertain result, inspect existing pull requests before retrying creation.

Return the pull request link, a short account of the change and validation, and any material unfinished work. Report publication separately from merge or deployment. Stop after the requested publishing action; creation does not authorize merge.
