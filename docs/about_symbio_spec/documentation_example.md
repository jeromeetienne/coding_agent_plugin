# A configured audience documentation example

- Created: 9 November 2026
- Last updated: 14 November 2026
- Status: Illustrative configuration and generated documentation example
- Related framing: [Agent instructions](../../AGENTS.md)
- Related rules: [docs_folder_system](../../skills/docs_folder_system/SKILL.md)
- Related issue: [Issue 43](https://github.com/jeromeetienne/coding_agent_plugin/issues/43)

## 0. Introduction

### 0.1. Sources and configuration

Connects approved product information to one complete documentation configuration for the fictional note editor. All paths, decisions and outcomes are illustrative; no generation or application exercise is claimed.

### 0.2. Pages and review evidence

Shows the audience-facing result and a separate review record. See [symbio_spec_to_docs](../../skills/symbio_spec_to_docs/README.md) for adoption and ownership, and the [configuration reference](../../skills/symbio_spec_to_docs/references/configuration.md) for authoritative field definitions and registration forms.

## 1. Preconditions

Suppose the example project has installed `symbio_spec` and `symbio_spec_to_docs`, then reviewed the proposals in the [specification example](specification_example.md). The project's actual decision record approves the Note definition, Save control and save expectations. Current implementation evidence supports the save feature. The proposed text alone would not satisfy these conditions.

Assume these receiving-project sources exist and can be read:

| Source | Role |
| --- | --- |
| `docs/symbio_spec/index.md` | Entry point to the six areas. |
| `docs/symbio_spec/decisions/index.md` | Routes to topic summaries and dated original decision records. |
| `docs/symbio_spec/decisions/summaries/note-saving.md` | Helps locate saving decisions and later amendments; check freshness and original approval evidence. |
| `docs/symbio_spec/decisions/2026/11/decision-000001-note-saving.md` | Original human decision, with actual approval scope and evidence. |
| `docs/symbio_spec/coverage.md` | Saving examined; sharing, deletion and phone support unexamined. |
| `docs/symbio_spec/glossary/note.md` | Approved Note definition. |
| `docs/symbio_spec/behaviour/save_note.md` | Approved saving and failure expectations. |
| `docs/symbio_spec/user_interface/note_editor.md` | Approved editor entry point and Save placement. |
| `src/note_editor/` and `tests/note_editor/` | Current implementation and relevant test expectations; inspecting tests does not execute tests. |

These example source locations use format `2.0.0`. A supported `1.0.0` project still uses its single decision file; documentation generation does not authorize migration. See the [decision reading procedure](../../skills/symbio_spec/references/format-v2.0.0.md#423-reading-procedure).

No page should claim autosave merely because autosave was approved for future implementation. No page should describe an implemented sharing feature if approved Symbiospec does not cover sharing. Both gaps belong in the review record when relevant to the requested scope.

## 2. Complete example configuration

The example project chooses `documentation_config/note_editor_help/config.md`. The following configuration contains all required fields. The caller supplies this chosen path; the skill does not discover the path automatically.

```markdown
# Note editor help configuration

- Documentation name: Note editor help
- Documentation type: User documentation
- Audience: People editing their first Note; readers know how to open the application but need no programming knowledge.
- Application: Note editor; implementation in src/note_editor/; relevant tests in tests/note_editor/.
- Symbiospec: docs/symbio_spec/index.md; decisions via docs/symbio_spec/decisions/index.md; coverage in docs/symbio_spec/coverage.md.
- Included topics: Opening the Note editor, saving one Note and recognizing save success or failure.
- Excluded topics: Developer setup, internal storage, sharing, deletion and phone instructions.
- User workflow: Open the application's Note editor, edit a Note and select Save; describe only entry points supported by the approved interface and current implementation.
- Output: docs/note_editor_help/; introduction page docs/note_editor_help/index.md.
- Presentation and publication: Markdown; publication none; only audience pages under docs/note_editor_help/ belong to this set; keep the review record outside this folder.
- Review record: docs/documentation_reviews/note_editor_help.md.
- Update procedure: Recheck affected pages when covered Symbiospec or application behaviour changes. Only the product owner may authorize configuration changes. Prepare one representative saving topic and its source mapping for product-owner content review before expanding the set.
```

The configuration has a distinct output folder outside sources, configuration and review records. Paths resolve from the fictional repository root. Additional sets require separate configurations and destinations that are neither identical nor nested. In a project requiring `docs_folder_system`, all affected documentation files receive metadata and folder navigation, including the separate review folder; add the required overview and index files during authorized setup.

## 3. Request and representative output

A direct request can supply the configuration without The Rules of the Repo:

> Use symbio_spec_to_docs with configuration documentation_config/note_editor_help/config.md. Generate the representative saving-a-Note topic and its introduction, and record source mapping and verification limits. Do not publish.

After checking dependencies, all requested configurations, approvals and implementation evidence, the expected pages are `docs/note_editor_help/index.md` and `docs/note_editor_help/save_a_note.md`. The introduction links the saving topic and explains the small covered scope. A useful passage in the saving topic could read:

> To keep your changes for later, select Save in the Note editor. Wait for the save confirmation before closing the Note. If saving fails, the editor reports the failure and keeps your unsaved text available so you can correct the problem or retry.

This passage is justified only if the approved specification and current implementation support every instruction. Actual interface wording comes from inspected sources; the example does not invent a success-message label. The full page includes prerequisites, supported editor entry steps and expected results. Metadata and navigation follow the receiving project's rules.

For a new set, review this representative topic before expanding. If evidence disagrees about failure recovery, omit unsupported instructions or explain a supported limitation and record the conflict. Generation must not silently change the approved expectation to match the application.

## 4. Separate review record

The example review record belongs in `docs/documentation_reviews/note_editor_help.md`. Include configuration identity and path, audience, application version or checkout, source locations, approval decisions and reviewed scope. Map individual page sections to specific specification headings, actual approvals and implementation evidence.

| Page section | Approved source to map | Implementation evidence to map |
| --- | --- | --- |
| Introduction scope | Coverage and approved Note definition. | Current editor entry point and available save action. |
| Save instructions | Note editor interface, save trigger and actual approval decision. | Save control and handler in `src/note_editor/`, plus relevant test expectations. |
| Failure guidance | Approved save failure expectations. | Failure handling and relevant tests; separately record any actual application exercise. |

Replace descriptions with precise file or heading references when generating a real set. An assumed file name alone is not evidence that the implementation was checked. Record gaps, conflicts, reasons for omissions and the evidence or decision needed to resolve each finding.

For example, approved but unimplemented autosave is omitted; an implemented sharing feature without approved Symbiospec is omitted and referred back to a separate Symbiospec task. Neither omission authorizes new product decisions during generation.

Record check results separately:

| Check | Honest example status |
| --- | --- |
| Clarity review | Product-owner review pending; not accepted merely because source checks passed. |
| Source accuracy | Record specific inspected files and approval decisions; do not claim review from this illustrative guide. |
| Executed tests | Not run in this example; name actual commands and results when performed. |
| Application exercises | Not performed in this example; no live save verification claimed. |
| Documentation build | Not performed; this configuration requests Markdown without a renderer. |
| Deployed website | Not performed; publication is outside this request. |

## 5. Updates and ownership

When save behaviour changes, use the mapping to identify affected sections, recheck approval and implementation, update the pages and record gaps. A missing mapping must be established for the affected scope first. Preserve accurate content and unrelated generated pages.

The skill owns generated passages even when a person edited a passage. Fix a product fact in Symbiospec or an editorial choice in configuration, with the applicable authority, then regenerate. Do not maintain undocumented manual exceptions. Configuration changes follow the stated product-owner authority; a normal source update does not authorize changing the audience or destination.

Publication would require separately authorized work using a configured renderer and deployment workflow, followed by the required browser checks. This example neither configures hosting nor establishes that any website is available.
