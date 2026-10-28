# About Symbiospec

- Created: 28 October 2026
- Last updated: 28 October 2026
- Status: Maintained overview for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related issue: [#15](https://github.com/jeromeetienne/coding_agent_plugin/issues/15)

This folder explains the concept Symbiospec to a person. Symbiospec is a shared product specification that humans can read and approve, and that coding agents use to guide the implementation and the verification of the software.

Read the documents in this order:

1. [what_is_symbio_spec.md](what_is_symbio_spec.md): what Symbiospec is, the problem that Symbiospec solves, what Symbiospec tries to do, and the reason for the name.
2. [areas.md](areas.md): the six areas of Symbiospec, and what each area is for.
3. [workflows.md](workflows.md): the three workflows of Symbiospec: initialize, update, and realign.

These documents explain the concept. They do not give the instructions for a coding agent. The instructions are in the skill `symbio_spec`:

- [SKILL.md](../../skills/symbio_spec/SKILL.md): the instructions of the skill `symbio_spec`.
- [format.md](../../skills/symbio_spec/references/format.md): the folder structure and the rules of each area.
- [workflows.md](../../skills/symbio_spec/references/workflows.md): the steps of each workflow.

The specification of one project is not in this folder. The specification of one project goes in the folder `docs/symbio_spec/` of that project.
