# The Rules of the Repo

- Created: 30 October 2026
- Last updated: 30 October 2026
- Status: Explanation for people
- Related framing: [Repository purpose](../CONTEXT.md)
- Related rules: [Docs folder system](../skills/docs_folder_system/SKILL.md)
- Related issue: [#24](https://github.com/jeromeetienne/coding_agent_plugin/issues/24)

## Why The Rules of the Repo exists

A repository has decisions that should remain true as the repository changes: what each folder is for, which packages may depend on other packages, how documentation is organized, and which product behavior has been agreed. Those decisions need to be written down, found before a change, and respected during the change.

The Rules of the Repo brings those rules together through one entry point. The purpose is to make repository changes follow explicit rules and preserve human control over decisions that need human approval. Selecting the applicable rule skills is the mechanism that connects a proposed change to those rules.

The skill [rules_of_the_repo](../skills/rules_of_the_repo/SKILL.md) coordinates that work. The skill holds no rule itself. Each individual rule skill explains how to check a particular kind of rule, while repository-specific configuration supplies the values for that repository.

## How the parts work together

| Part | Responsibility |
|---|---|
| The receiving repository's `AGENTS.md` | Tells the coding agent to follow The Rules of the Repo before each change and gives the path of the rules list. |
| Rules list | Lists the rule skills, when each rule skill applies, the type of each rule, and the configuration file of each rule skill, or “none” when no configuration is needed. |
| Rule skill | Explains how to read, obey, and check a particular kind of rule. |
| Repository-specific configuration | Gives the values that a rule skill requires for the receiving repository. |

For example, the skill [docs_folder_system](../skills/docs_folder_system/README.md) defines the form of documentation files. The receiving repository supplies the documentation folder path and any files exempt from the metadata header. The same skill can then work in several repositories with different folder paths.

Configuration stays outside the folder of the rule skill. Each rule skill that needs configuration has a separate configuration file, in a folder named after the rule skill. Keeping repository values separate allows the skill to be reused without carrying the decisions of one repository into another repository.

## How a change is checked

Before a change, the coding agent reads the rules list and finds every rule skill that applies. When applicability is uncertain, the coding agent includes the rule skill. The coding agent reads each applicable rule skill and supplies the configuration listed for that rule skill.

Each rule skill checks that the required configuration exists and is complete. Missing configuration stops the change; the coding agent reports the missing configuration or value. When the rules list itself is missing, the coding agent reports that The Rules of the Repo is not configured and offers to set up The Rules of the Repo.

The coding agent checks the proposed change against every applicable rule. When the change violates a rule, the coding agent corrects the proposed change. When completing the work requires changing a rule, the rule type determines who may make that decision.

## Who may change a rule

| Rule type | Who may change the rule | Example |
|---|---|---|
| Static rule | The coding agent obeys the rule and corrects violations, but never changes the rule. | A coding style. |
| Living rule with human approval | The coding agent proposes a change; the human decides before the coding agent writes the changed rule. | Folder constraints or a product specification. |
| Living rule without human approval | The coding agent updates the rule without asking the human. | Agent-maintained `CONTEXT.md` notes. |

For a living rule with human approval, the coding agent shows the current rule and the proposed rule in a short table. The human chooses **Approve**, **Cancel**, or **Refine**. Approval permits the coding agent to write the proposed rule and continue the work. Cancellation keeps the current rule and prevents the conflicting change. Refinement continues the discussion until a revised proposal can be reviewed.

The configuration file follows the rule type recorded in the rules list for that rule skill. Editing configuration must respect the same ownership as editing the rule.

## Where Repo Folders Constraints fits

[Repo Folders Constraints](../skills/repo_folders_constraints/README.md) is one rule skill within The Rules of the Repo. Repo Folders Constraints covers the responsibilities and boundaries of folders and packages. The rules file records what each folder or package does, what each folder or package must never contain or do, the permitted imports between packages, required languages and technologies, and the workflow for changing content.

The human owns the rules file. Repo Folders Constraints is a living rule with human approval: the coding agent reads and obeys the rules file, and proposes rule changes for human review. A folder without a rule, or a decision marked “not decided yet” that the work now needs, requires a proposal.

Agent-maintained `CONTEXT.md` files serve a different purpose. The context files record notes that help future work, and the coding agent can update the notes without human approval. When a context file disagrees with the Repo Folders Constraints rules file, the rules file takes precedence and the coding agent corrects the context file.

### Example: adding a document

Suppose a configured repository uses Repo Folders Constraints and Docs folder system, and the developer asks for a new document in `docs`.

The coding agent reads the rules list and loads both rule skills with their configuration. Repo Folders Constraints checks whether the document belongs in `docs` and whether the document follows the workflow for that folder. Docs folder system checks the metadata header and requires an entry in the folder's `index.md`.

If the folder permits the document, the coding agent writes the document and updates the index. If the document conflicts with the folder's responsibility, the coding agent first looks for a change that obeys the existing rule. When the work requires changing the folder's responsibility, the coding agent presents the current and proposed rules for human approval before changing the rules file or making the conflicting change.

## Adopting The Rules of the Repo

Installing the skill gives the coding agent the instructions; the receiving repository still needs a rules list and the required configuration. The human and coding agent choose the rule skills and agree on the repository-specific values. The receiving repository's `AGENTS.md` then points to the rules list and requires The Rules of the Repo before every change.

For an existing repository, the coding agent first reads the repository and proposes suitable rule skills and configuration values. Each value needs human approval. The coding agent then identifies differences between the repository and the agreed rules, and proposes a plan for human approval before removing those differences. A large plan is divided into steps that can be reviewed separately, with the repository's tests run after each step.

Individual rule skills can also work without The Rules of the Repo when another caller supplies their configuration. For example, this repository currently configures Docs folder system directly in [AGENTS.md](../AGENTS.md). Publishing a rule skill in this repository does not automatically configure that rule skill for this repository.

## Further reading

- [The Rules of the Repo instructions](../skills/rules_of_the_repo/SKILL.md): the full procedure and setup templates for coding agents.
- [The Rules of the Repo overview](../skills/rules_of_the_repo/README.md): installation and related skills.
- [Repo Folders Constraints instructions](../skills/repo_folders_constraints/SKILL.md): the rules file format and the procedure for proposing a rule change.
- [Docs folder system instructions](../skills/docs_folder_system/SKILL.md): documentation metadata and folder navigation.
