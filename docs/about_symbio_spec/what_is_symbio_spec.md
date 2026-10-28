# What Symbiospec is

- Created: 28 October 2026
- Last updated: 28 October 2026
- Status: Maintained explanation of the concept Symbiospec for people
- Related framing: [Agent instructions](../../AGENTS.md)
- Related issue: [#15](https://github.com/jeromeetienne/coding_agent_plugin/issues/15)

## 1. Definition

Symbiospec is a shared product specification. Humans can read and approve Symbiospec. Coding agents use Symbiospec to guide the implementation and the verification of the software.

Symbiospec describes the concepts of the product, the expected behaviours, the user interface, the styling, the supported platforms, and the overall organization of the system. Symbiospec does not describe each line of code.

## 2. Purpose

Coding agents write code faster than a human can review the code. One developer with coding agents can make many pull requests each day, with many thousands of changed lines. A human cannot read all these changes line by line, and more human reviewers remove most of the speed that the coding agents give.

Symbiospec moves a large part of the human control from the review of the code to the review of the product:

- The coding agents write and examine the details of the implementation.
- Automated tests examine the correctness and the quality of the code.
- The human controls what the product does and how the product behaves.

The human does not read every detail of the implementation. The human reads and approves the model of the product in Symbiospec, and the model of the product stays small enough for a human to understand.

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

## 5. Sources

- [Issue #10](https://github.com/jeromeetienne/coding_agent_plugin/issues/10): Symbiospec definition and structure.
- [Issue #11](https://github.com/jeromeetienne/coding_agent_plugin/issues/11): Symbiospec workflow guide.
- [README.md](../../skills/symbio_spec/README.md) of the skill `symbio_spec`.
