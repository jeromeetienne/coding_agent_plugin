# What Symbiospec is

- Created: 28 October 2026
- Last updated: 9 November 2026
- Status: Maintained explanation of the concept Symbiospec for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related rules: [docs_folder_system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 15](https://github.com/jeromeetienne/coding_agent_plugin/issues/15), [Issue 10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10), [Issue 11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11)

## 0. Introduction

### 0.1. Definition and purpose

Explains the shared product specification, human review and the reason for the name.

### 0.2. Current scope

Separates current reusable instructions from the broader design proposal and unsupported automation claims.

## 1. Definition

Symbiospec is a shared product specification. Humans can read and approve Symbiospec. Coding agents use Symbiospec to guide the implementation and the verification of the software.

Symbiospec describes the concepts of the product, the expected behaviours, the user interface, the styling, the supported platforms, and the overall organization of the system. Symbiospec does not describe each line of code.

## 2. Purpose

Coding agents write code faster than a human can review the code. One developer with coding agents can make many pull requests each day, with many thousands of changed lines. A human cannot read all these changes line by line, and more human reviewers remove most of the speed that the coding agents give.

Symbiospec moves a large part of the human control from the review of the code to the review of the product:

- The coding agents write and examine the details of the implementation.
- Automated tests examine the correctness and the quality of the code.
- The human controls what the product does and how the product behaves.

The human does not read every detail of the implementation. The human reads and approves the model of the product in Symbiospec, with summaries and references intended to keep the product model understandable. Useful scope and review effort depend on the project; the skill does not guarantee a particular reduction in review work.

## 3. What Symbiospec tries to do

1. Keep the human intent in control of the software. An approved decision of the human is the reference for the coding agents.
2. Keep three things separate:
   - The observed behaviour: what the software does now.
   - The proposed specification: what a coding agent proposes.
   - The approved specification: what the human approved.
3. Ask the human to review prepared batches of concrete decisions. The coding agent does the investigation first. Then the human accepts, rejects, revises, or defers each decision quickly, without a long wait between two decisions.
4. Report a difference between the software and the specification. Never change the approved specification silently to accept the difference.

## 4. The name

Symbiospec is the short form of "Symbiotic Spec", the name that [issue #10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10) gives.

- "Symbiotic" comes from biology. A symbiosis is a cooperation between two different organisms. Humans and coding agents work in different ways, and Symbiospec gives the two a common reference.
- "Spec" is the short form of "specification". Each area of the specification has one clear responsibility, and a human can review and verify each expected behaviour.

[Issue #10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10) compares Symbiospec to the music in the film "Close Encounters of the Third Kind": a short sequence of notes starts the communication between humans and visitors that are very different from humans. Symbiospec has the same function between humans and coding agents.

## 5. Current decisions and design limits

[Issue 10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10) is a design proposal with historical paths and proposed capabilities. The current [skill instructions](../../skills/symbio_spec/SKILL.md) and [format reference](../../skills/symbio_spec/references/format.md) establish the supported workflow. The following distinctions prevent design ideas from becoming unsupported claims.

| Subject | Current instructions | Limit |
| --- | --- | --- |
| Location and format | Markdown project data under `docs/symbio_spec/`, six areas, decisions and coverage records. | Historical `docs/agent_rules` paths do not select a new project's location. |
| Folder responsibilities | Area overviews state contents, exclusions and references; indexes list children. | No additional structured folder-contract format is required. |
| Concepts and aliases | Canonical definitions, stable document or heading references, evidence and human decisions. | No mandatory identifier scheme or blind rename of code, stored data or external interfaces. |
| Auditing and comparison | Bounded read-only investigation and Realignment findings with evidence, severity, confidence and recommendations. | No dedicated executable audit command, automatic completeness score or exhaustive product verification is supplied. |
| Initialization and migration | Small validated increments preserve useful documents and known approvals. | Uncertain history and existing code do not establish approval. |
| Review and tests | Prepared product decisions and checks appropriate to the actual change. | Automatic test generation and independent verification by separate agents remain design ideas, not supplied capabilities. Technical checks for security, data integrity and performance remain necessary. |
| Audience documentation | `symbio_spec_to_docs` separately uses approved sources plus implementation evidence and supplied configuration. | No automatic publication or screenshot generation is established by `symbio_spec`. |

The older [docs_folder_agents_rules_system](../../skills/docs_folder_agents_rules_system/README.md) is obsolete for new adoption. Existing installations are preserved and migrated only through an authorized task. [docs_folder_system](../../skills/docs_folder_system/README.md) governs document form when required by a receiving project; document form does not approve product meaning.

This guide describes reusable instructions, not a verified audit of Heidrun Code or another receiving project. No productivity estimates in the design proposal are guarantees or current measurements.

## 6. Sources

- [Issue #10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10): Symbiospec definition and structure.
- [Issue #11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11): Symbiospec workflow guide.
- [README.md](../../skills/symbio_spec/README.md) of the skill `symbio_spec`.
