---
name: symbio_spec_to_ux
description: Draft workflow to propose screens and navigation from an approved Symbiospec using objects, relationships, calls to action, and attributes. Use before user interface implementation or during review of interface structure.
---

# Symbiospec to UX

**Status: Draft — not tested on a real project.** The test project and trial approach remain undecided in [issue #25](https://github.com/jeromeetienne/coding_agent_plugins/issues/25). Do not claim readiness from writing or structurally checking this draft.

## 1. Purpose and scope

Propose user interface structure from a bounded, approved Symbiospec through Object-Oriented UX, Sophia Prater's approach to organizing interfaces around things users recognize. ORCA names four concerns: objects, relationships, calls to action, and attributes. This is a focused adaptation, not the complete ORCA process. See the [method reference](https://ooux.com/offerings/fourfails).

Read repository instructions and affected approved specifications first. Use the [Symbiospec skill](../symbio_spec/SKILL.md) and [format reference](../symbio_spec/references/format.md) for specification ownership, proposals, decisions, and coverage. Follow the receiving project's documentation rules.

A proposal does not authorize implementation, installation, a prototype, or changes to approved behaviour. Use existing authorization without requesting the same approval again.

## 2. Establish evidence

Identify the selected user tasks, users, approved Glossary and Behaviour references, existing User Interface decisions, Styling rules, and Platform Support constraints. Record approval evidence, observed implementation, and missing sources separately.

If approved specifications are missing, prepare the needed specification decisions through the Symbiospec workflow. Partial approved coverage can support a bounded proposal. Continue supported work and identify decisions that block dependent work. Never fill gaps with invented product behaviour.

## 3. Write the four lists

Link each entry to its source and distinguish approved input, proposed interface choice, and unresolved product decision. Preserve canonical names. Do not turn every noun into an object or every object into a page.

| List | Record | Check |
| --- | --- | --- |
| Objects | Recognizable things users identify and act on, with purpose and identity. | Distinguish objects from values, states, actions, and implementation details. Flag concepts absent from the Glossary. |
| Relationships | Connected objects, direction, permitted number of connections, ownership when specified, and proposed navigation in each direction. | Separate documented relationships from proposed links. Mark unknown connection rules. |
| Calls to action | Object, user or role, action, conditions, result reference, and relevant failure or unavailable states. | Derive permissions and outcomes from Behaviour. Do not assume creation, editing, or deletion is permitted. |
| Attributes | Object details, source, importance to the task, and proposed appearance in a list, detail view, or form. | Distinguish related objects from values; preserve visibility and editing restrictions. |

Revisit the lists together when a relationship, action, or attribute challenges an object boundary. Record conflicts and alternatives rather than forcing uncertain concepts into the model.

## 4. Propose screens and navigation

Prioritize objects, actions, and information for the scoped tasks. Explain why views are grouped or separated. For each screen or view, describe purpose, entry points, displayed objects and attributes, available actions, related-object links, and return paths.

Reference Behaviour for outcomes rather than copying complete definitions. Cover relevant empty, loading, failure, and unavailable states; expose undefined outcomes as decisions. Preserve established Styling and Platform Support constraints. This method does not choose a visual style or framework.

Walk through ordinary tasks with clearly fictional representative records. Include a connected-object journey and a failure or unavailable action when supported by the scope. Check that users can identify the current object, find related objects, perform permitted actions, and understand results. Identify gaps that prevent a complete journey.

## 5. Review and maintain the specification

Present the four lists, screen and navigation proposal, task walkthroughs, source links, alternatives, and open decisions together. When saving is authorized, use `docs/symbio_spec/proposals/` in the receiving project and maintain required indexes; otherwise present the proposal in the conversation.

Prepare concrete decisions with reasons, examples, consequences, and dependencies before review. Review one decision at a time when the human prefers that pace. Record accept, reject, revise, or defer. Deferred decisions remain unresolved and block only dependent work.

After approval, update affected User Interface specifications, decisions, coverage, and indexes within authorization. Keep definitions in Glossary, outcomes in Behaviour, and reusable visual rules in Styling. Proposal approval does not establish implementation or testing.

## 6. Trial before readiness

Agree on a useful real project, approved scope, and trial approach before claiming readiness. The project needs meaningful interface decisions still open. Do not invent a feature for the trial. Repeating the Project Management example that informed this method gives limited evidence of transfer.

A possible trial, still requiring agreement, is to apply the draft locally, review the proposal, then create a temporary clickable prototype with representative records after authorization. Do not install or mutate another project merely to finish this draft.

Record project, approved inputs, draft version, proposal, human feedback, tasks exercised, failures, and resulting revisions. Distinguish document validation, proposal approval, prototype observations, and implemented-software checks. Retain Draft status until the agreed trial supplies evidence of usefulness and the human accepts a readiness change.
