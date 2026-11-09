# The six areas of Symbiospec

- Created: 28 October 2026
- Last updated: 9 November 2026
- Status: Maintained explanation of the areas of Symbiospec for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related rules: [docs_folder_system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 15](https://github.com/jeromeetienne/coding_agent_plugin/issues/15), [Issue 10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10), [Issue 11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11)

## 0. Introduction

### 0.1. Responsibilities

Explains the six areas and their example facts, then identifies information each area leaves elsewhere.

### 0.2. References

Links the authoritative format and a small example showing how the areas connect.

## 1. Why six areas

Symbiospec has six areas. Each area owns one type of fact. A fact is written in one area only, and the other areas link to that fact. Keeping one responsible location reduces duplication. Reviews must still detect contradictory references or outdated descriptions.

The examples below use a Macro, a concept of the product Heidrun. The full rules of each area, with the exclusions, are in [format.md](../../skills/symbio_spec/references/format.md) of the skill `symbio_spec`.

## 2. The areas

1. **Glossary**: the name, the definition, the purpose, and the relations of each concept of the product. Example: what a Macro is, and how a Macro relates to a Pane.
2. **Behaviour**: the expected result that a person can see, the conditions, the changes of state, and the failures. Example: what the execution of a Macro writes into a Pane, and what occurs when the execution fails.
3. **User Interface**: the screens, the navigation, the position of the controls, and how a person starts a behaviour. Example: where the control that executes a Macro is.
4. **Styling**: the visual rules that the user interface uses again and again: typography, colours, spacing, states of the controls. Example: how a disabled control looks.
5. **Platform Support**: the supported environments, the input methods, and the limits of each platform. Example: the keyboard environments and the touch environments that the product supports.
6. **System Overview**: a short map of the major parts of the system, their responsibilities, their relations, and the reasons for important structural decisions. Example: which major part stores the information, and which major part shows the information.

## 3. Placement and exclusions

| Area | Keep elsewhere |
| --- | --- |
| Glossary | Control placement, complete scenarios, visual rules and implementation internals. |
| Behaviour | Screen layout, styling, repeated concept definitions and internal algorithms. |
| User Interface | Complete expected outcomes and reusable visual rules; reference Behaviour and Styling. |
| Styling | Feature outcomes and navigation placement. |
| Platform Support | Unverified support promises and copies of feature-specific behaviour. |
| System Overview | Functions, classes and exhaustive implementation inventories; link separate technical documentation. |

An area's README states what the area contains, excludes and references, with a boundary example. Folder overviews and indexes support navigation; folder location alone does not prove that content is approved. The [specification example](specification_example.md) connects one fact in each area without duplicating definitions.

## 4. Sources

- [Issue #10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10): Symbiospec definition and structure.
- [format.md](../../skills/symbio_spec/references/format.md) of the skill `symbio_spec`.
