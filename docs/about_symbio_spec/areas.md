# The six areas of Symbiospec

- Created: 28 October 2026
- Last updated: 28 October 2026
- Status: Maintained explanation of the areas of Symbiospec for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related issue: [#15](https://github.com/jeromeetienne/coding_agent_plugin/issues/15)

## 1. Why six areas

Symbiospec has six areas. Each area owns one type of fact. A fact is written in one area only, and the other areas link to that fact. Thus a change of a fact changes one place, and two areas cannot disagree.

The examples below use a Macro, a concept of the product Heidrun. The full rules of each area, with the exclusions, are in [format.md](../../skills/symbio_spec/references/format.md) of the skill `symbio_spec`.

## 2. The areas

1. **Glossary**: the name, the definition, the purpose, and the relations of each concept of the product. Example: what a Macro is, and how a Macro relates to a Pane.
2. **Behaviour**: the expected result that a person can see, the conditions, the changes of state, and the failures. Example: what the execution of a Macro writes into a Pane, and what occurs when the execution fails.
3. **User Interface**: the screens, the navigation, the position of the controls, and how a person starts a behaviour. Example: where the control that executes a Macro is.
4. **Styling**: the visual rules that the user interface uses again and again: typography, colours, spacing, states of the controls. Example: how a disabled control looks.
5. **Platform Support**: the supported environments, the input methods, and the limits of each platform. Example: the keyboard environments and the touch environments that the product supports.
6. **System Overview**: a short map of the major parts of the system, their responsibilities, their relations, and the reasons for important structural decisions. Example: which major part stores the information, and which major part shows the information.

## 3. Sources

- [Issue #10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10): Symbiospec definition and structure.
- [format.md](../../skills/symbio_spec/references/format.md) of the skill `symbio_spec`.
