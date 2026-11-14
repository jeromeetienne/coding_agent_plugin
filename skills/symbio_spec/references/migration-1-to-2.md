# Symbiospec decision storage migration: 1.0.0 and 2.0.0

## 0. Introduction

### 0.1. Scope

For coding agents converting an authorized project's complete Symbiospec folder between [1.0.0](format-v1.0.0.md) and [2.0.0](format-v2.0.0.md). This is a procedure, not an installed executable converter. Unversioned adoption remains a separate metadata-only step under [versioning](versioning.md#3-unversioned-adoption).

### 0.2. Preservation

Preserve original text, sequence, scope, evidence and uncertainty. Test reverse conversion on a separate copy before completing a forward migration. Installation or a supported `1.0.0` folder does not authorize migration.

### 0.3. Recovery

Apply every snapshot, interruption marker, validation and final version replacement requirement from the shared [migration procedure](versioning.md#4-prepare-and-apply-migration). This reference supplies the specific content mapping; it does not replace those requirements.

## 1. Prepare the source mapping

Inventory the whole folder and affected external references, including local changes. Verify a restorable snapshot outside Symbiospec. Read the actual history: `1.0.0` does not impose uniform headings, decision identifiers or dates, so a regular expression that merely splits headings is insufficient. Identify actual decisions and their boundaries from source text and evidence. Do not split a decision's conditions or approval evidence into a different decision. Do not turn proposals or explanatory prose into decisions. If boundaries are ambiguous, report the exact passages and resolve classification before changing input.

Prepare a bijective mapping: each source decision maps to exactly one target record, and no target record invents a decision. Record source order independently of dates. Reuse unique positive existing decision numbers if possible; otherwise allocate unused numbers and retain original identifiers as aliases in the mapping and record. Source order becomes consecutive `History order` values starting at 1 even when existing identifiers are not ordered. Assign each target's date folder from an unambiguous full decision date; preserve unknown, partial and ambiguous date text and use `undated/`. Never use the migration date as the decision date.

Create `decisions/migration-map.md`, an administrative mapping with the receiving project's document header. It records:

- Source and target formats, source history path, source byte length, newline convention, and SHA-256 checksum.
- Each source decision's original identifier if any, ordinal, byte range (start inclusive, end exclusive), original block checksum, target number, history order and path.
- Every byte outside decision blocks, including title, metadata, preamble, gaps and trailing material, with positions and exact bytes. Use fenced text when exact encoding and line endings can be retained; otherwise use Base64 byte encoding, labelled as administrative preservation data. Every source byte must belong to exactly one decision block or one retained segment, with no overlaps or gaps.
- Old heading and anchor to new record and anchor mappings, including duplicate heading suffixes and external references that cannot be changed.
- Created paths with verified output checksums (including generated records, summaries and indexes; keep the mapping file's own checksum in external recovery evidence to avoid self-reference), and every changed reference location: file, before/after link text, and sufficient context to reverse the precise edit. Record checksums for the affected files before and after conversion. For exact restoration retain before-images of changed administrative files, encoded as bytes if necessary; do not put a second complete decision history in the mapping.

The mapping and retained non-decision text are not approval evidence. If source prose has product meaning, preserve that meaning visibly in the appropriate specification or migration notes with its original status; do not hide meaningful content solely in encoded metadata. Record that mapping for reverse conversion. Use an unused mapping path only as defined here; if conflicting target files already exist, stop before overwriting anything.

## 2. Forward conversion: 1.0.0 to 2.0.0

1. Obtain conversion authorization, complete the mapping and verified snapshot, stop competing writers, and create `.format-migration.md` before changing source input. Resolve destination collisions rather than overwriting local files. Keep the `1.0.0` version record until verification succeeds.
2. Create `decisions/`, `summaries/`, required date folders and `undated/` only where needed, with overviews and indexes. Even an empty source history creates the decision and summary overviews and indexes plus the migration mapping, but no invented decision. An empty `decisions.md` with an explicit no-decisions statement is retained as non-decision text in the mapping.
3. Write each original decision as a `2.0.0` record with required metadata and sections. Populate fields only from actual recorded facts. Label missing facts `Unknown — not recorded`; a migration does not create human approval. Preserve the entire original source block byte for byte in a final `## 5. Original record` section, inside a code fence longer than any fence in the source. The mapping supplies exact byte length and checksum; delimiter newlines are not part of the original bytes. Original relative links inside this historical quotation retain their original text. Make usable links in the structured fields, resolved from the original history location to the new record location; do not silently rewrite the preserved block. The original block is part of this decision's record, not a competing history.
4. Build summary topics from affected specifications, concepts and explicit relationships, including cross-topic replacements and unresolved conditions. Route uncertain classification to `unclassified`. Mark topics `Needs update`, produce summaries from their original records, store the topic checkpoints and record checksums, then mark verified topics `Current`. Preserve unknown or conflicting approval as unknown or conflicting. Topic documents continue to state current requirements; migration changes storage and links, not product meaning.
5. Update folder indexes, approval references, record-to-record links, known references elsewhere in the repository, and configured consumer source locations. The root Symbiospec index links `decisions/index.md` instead of the old history. Map links to old sections to the relevant new record, preserving fragments only when valid. Links to the entire old history go to the decision index. Handle relative paths and repository-hosted file links, not just a literal filename search. Resolve filesystem aliases consistently when recalculating relative paths. Do not register the temporary migration marker in product indexes; removing the marker must not leave a broken index link. If external links cannot be updated, retain a non-authoritative `decisions.md` compatibility page with the old anchors and links to their mapped records, explicitly stating that the original records live under `decisions/`. This page contains no copied decisions; record its purpose and limitations. If an old anchor cannot be mapped reliably, stop or report and resolve that reference before claiming verified migration.
6. Verify the target folder against the complete `2.0.0` definition. Check source-to-target cardinality and history order, unique identities, original block byte equality and checksums, retained prose, all required metadata, approval status, conditions, complete topic routing, summary checkpoints and checksums, link destinations including anchors, and the whole changed-file inventory. Compare every unaffected file byte for byte; do not rewrite an unaffected text file merely to normalize line endings. Source originals remain in the external snapshot and per-record original blocks; remove the obsolete authoritative history only after verifying the replacement. A compatibility page may remain as described above.
7. On a separate copy, run section 3's exact reverse conversion and compare the recovered source paths and bytes against the complete snapshot, including external reference files. A non-identical reconstruction fails this check. Exercise the retrieval and maintenance cases in [decision examples](decision_examples.md); report actual files opened and limitations.
8. Complete the shared finalization: atomically replace the version record with `2.0.0` only after verification, verify the completed folder again, then remove the interruption marker last. Retain mapping and verified recovery evidence. Report actual counts, checks, unavailable references and any remaining limitations.

## 3. Reverse conversion: 2.0.0 to 1.0.0

Use the same authorization, verified snapshot, interruption marker and atomic finalization rules. Inventory all live original records, including `undated/`, and all incoming links before changing anything. Reverse conversion is not deletion of the version record.

### 3.1. Exact restoration immediately after migration

When the mapping exists and all mapped original blocks, record fields, summaries, specifications and reference files match their verified post-migration state, reconstruct `decisions.md` by interleaving the recorded original blocks and retained segments at their source byte ranges. Verify the source length and checksum. Restore changed administrative files and reference edits from the recorded before-images or verified snapshot, but only after confirming that those files contain no later unrelated edits. Remove only migration-created paths that still match the recorded output inventory. Restore the source version record using the shared finalization procedure. Compare the complete recovered inventory and bytes with the source snapshot, not just the concatenated decision text.

If there are later edits or added records, this exact-restoration path is unavailable. Do not overwrite later work with the old snapshot. Use section 3.2 or stop unchanged with a precise explanation.

### 3.2. Conversion after subsequent decisions or for a new 2.0.0 project

Format `1.0.0` allows detailed Markdown decisions; represent each live decision as a section of the single history file, ordered by `History order`. Preserve permanent number, original date text, outcome and partial approval, scope, topics, source and approval links, reasons, precise replacement relationships, conditions, original migrated text when present, and correction evidence. Use permanent explicit anchors such as `decision-000041` and update all incoming links and configured consumer paths to those anchors. Recalculate relative evidence links from the history file's location. Preserve historical quoted link text and explain its original base location.

Summaries and indexes are derived navigation, not a second authoritative history. Before removing the decision folder, check for independent commentary or unresolved conditions that exist only in summaries, overviews or the mapping. Preserve such content visibly in a labelled history appendix or its responsible topic document, keeping its original approval status; record the exact mapping. Remove generated navigation only after confirming that every fact and reference is preserved. Archive administrative conversion evidence in the verified external snapshot. If a field, relation or custom extension cannot be represented without changed meaning, identify the exact data and stop before mutation; do not silently omit data or assert that every reverse conversion is lossless.

Validate the complete `1.0.0` folder, no omissions or duplicate decisions, retained sequence and evidence, all anchors and reference updates, unaffected-file bytes, and one authoritative history. Rehearse the conversion on a copy before applying it. This path preserves meaning and history but does not promise byte-identical restoration of the earlier folder. Report that distinction explicitly. Finalize the `1.0.0` version record only after verification.

## 4. Interruption and failure

The shared `.format-migration.md` blocks normal work throughout either direction, even after the target version has been written. Preserve the interrupted state separately. Recover only from verified inventories and snapshots; keep unrelated edits. Resume the published conversion or restore the complete source, verify the resulting folder and references, and remove the marker last. Duplicate numbers, ambiguous source boundaries, failed original checksums, stale summaries, unresolvable required references, or an unavailable verified reverse path prevent successful completion.
