# symbio_spec_to_ux

**Status: Draft — not tested on a real project.** The test project and trial approach remain open in [issue #25](https://github.com/jeromeetienne/coding_agent_plugins/issues/25).

The [skill instructions](SKILL.md) propose screens and navigation from approved Symbiospec using objects, relationships, calls to action, and attributes. The output includes source links, representative task walkthroughs, and decisions for human review.

The receiving project needs an approved Symbiospec for the selected scope. Missing decisions remain explicit. No visual framework or prototype tool is required.

The expected Symbiospec format is `1.0.0`, including its unversioned equivalent. The shared [version check](../symbio_spec/references/versioning.md) runs before proposals; unsupported or malformed versions and incomplete migrations stop normal work. A proposal request does not authorize source migration.

Example request:

> Use symbio_spec_to_ux to propose screens and navigation for this feature's approved Symbiospec. Identify missing decisions and do not implement the proposal.

The draft is available for deliberate evaluation. Proposal approval, prototype testing, and verification of implemented software are separate results. No real-project trial has been agreed or completed.
