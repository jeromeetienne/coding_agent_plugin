# A small Symbiospec example

- Created: 9 November 2026
- Last updated: 9 November 2026
- Status: Illustrative specification and review example
- Related framing: [Agent instructions](../../AGENTS.md)
- Related rules: [docs_folder_system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 42](https://github.com/jeromeetienne/coding_agent_plugin/issues/42), [Issue 10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10)

## 0. Introduction

### 0.1. Scope and placement

Shows a fictional note editor and the files that would hold one small proposed specification. No example establishes requirements, approval or observed behaviour for an actual product.

### 0.2. Review and coverage

Shows what a review decision would establish and how to retain partial coverage. The authoritative conventions remain in the [format reference](../../skills/symbio_spec/references/format.md).

## 1. Receiving-project files

Assume a receiving project is introducing Symbiospec and has authorized inspection of saving a Note. The following paths are relative to that fictional repository, not links to existing files in this collection:

```text
docs/symbio_spec/
  README.md
  index.md
  decisions.md
  coverage.md
  glossary/note.md
  behaviour/save_note.md
  user_interface/note_editor.md
  styling/control_states.md
  platform_support/desktop.md
  system_overview/note_editor.md
```

Each of the six area folders also has its own README.md and index.md. Create topic files only when useful content exists, and register each file in the owning index. The area README explains contents, exclusions and references. Register `symbio_spec/index.md` in the receiving project's documentation index during authorized initialization.

## 2. One concept, linked expectations

The following excerpt would be `docs/symbio_spec/glossary/note.md`. The excerpt includes the metadata and numbered structure expected by the format; links resolve within the fictional receiving project:

```markdown
# Note

- Created: 9 November 2026
- Last updated: 9 November 2026
- Status: Proposal
- Related framing: [Symbiospec overview](../README.md)

## 0. Introduction

### 0.1. Definition

Defines Note without describing control placement or saving outcomes.

## 1. Definition

A Note is a named piece of editable text retained for later use.
The Note has a title and text content.

## 2. Relationships

A Note can be edited in the Note editor. See
[Note editor](../user_interface/note_editor.md) for control placement and
[Save a Note](../behaviour/save_note.md) for expected saving outcomes.

## 3. Evidence and review

This definition awaits human review. The investigation found a title field
and text editor; no historical aliases have been confirmed.
Record the actual source references before presenting the proposal.
```

The corresponding Behaviour document would reference the Note definition and contain these proposed expectations:

```markdown
## 1. Trigger and conditions

The user invokes Save for the current [Note](../glossary/note.md).
The Note editor contains unsaved text changes.

## 2. Expected result

The application retains the current title and text for later reopening
and confirms successful saving.

## 3. Failure

If saving fails, the application reports failure and does not claim success.
The unsaved editor text remains available for correction or retry.
```

The Behaviour excerpt would also need a title, metadata, short numbered introduction and actual evidence and approval references. The example does not choose a database, internal algorithm or function name.

## 3. Other area boundaries

The remaining documents can refer to the same facts without restating the Note definition or save outcomes:

| Example file | Proposed content and references |
| --- | --- |
| `user_interface/note_editor.md` | The editor has title and text fields and a Save control. Link Save to `../behaviour/save_note.md`; link Note to `../glossary/note.md`. |
| `styling/control_states.md` | Reuse the project's established visual convention for disabled controls. Link applications of that convention to User Interface. Do not invent colours to fill an empty section. |
| `platform_support/desktop.md` | Record the human's required desktop browser environment and any actual observations separately. Phone support remains unexamined. |
| `system_overview/note_editor.md` | Explain that the editor presents the current Note and a storage part retains saved information, if evidence and review support that structural choice. Leave detailed classes outside Symbiospec. |

The disabled state appearance belongs to Styling; conditions that disable Save belong to Behaviour. A platform requirement does not prove that the requirement has been tested. An initial review need not populate all six areas.

## 4. Prepared review and approval

The coding agent prepares actual source references, confidence, examples, affected scope, consequences and dependencies before requesting review. For this example, the decisions might be the Note definition, whether failed saves preserve editor text, and where Save appears. Definition review precedes adopting authoritative dependent descriptions.

If the human actually accepts the definition and save expectations, `decisions.md` records the decision source, date, approved scope, affected documents and conditions. The approved topic identifies that decision as approval evidence. Until that decision exists, the topic remains proposed or observed. Never copy a fictional acceptance into a real decision record.

Reject, revise and defer remain valid outcomes. For example, a deferred decision about failure recovery stays outside the approved scope. High confidence in code or a passing save test does not establish approval. An administrative status such as “Maintained overview for people” does not approve the product content linked by the overview.

## 5. Coverage and next increment

A useful `coverage.md` would state that the investigation examined saving one Note, identify the actual approval scope and record unresolved failure recovery questions. Sharing, deletion and phone support remain unexamined. Link known software differences and relevant reports instead of hiding differences in revised expectations.

Documentation checks would verify area ownership, evidence and approval references, links and indexes. Application tests and live exercises are separate checks. After review, Update maintains this small baseline while initialization can investigate another concept. The [workflow guide](workflows.md) explains the cycle; the [documentation example](documentation_example.md) shows a later task using approved and implemented content.
