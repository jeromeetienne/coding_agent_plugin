# Realign Symbiospec when drift is detected

Run this workflow when requested, or as part of an explicitly authorized recurring review. The skill itself does not schedule future work. A periodic check is useful even when nobody has reported drift.

## 1. Compare without modifying

Identify the approved references and an explicit scope. Compare the current specification with implementation paths, relevant test expectations, and permitted application observations. Record examined and unexamined areas. Read-only comparison does not permit unrequested code or specification corrections.

## 2. Report differences

Write the report under `docs/symbio_spec/reports/` when saving the report is authorized. Otherwise present the findings in the conversation. Check outdated descriptions, undocumented capabilities, conflicting requirements, implementation regressions, missing or contradictory test coverage, terminology, section ownership, and broken references.

For each finding, distinguish evidence from inference and confidence from severity. Include expected and observed results, affected references, recommended correction, and whether a new product decision is needed. A missing test is a coverage gap, not proof that the feature is broken.

## 3. Review proposed corrections

Prepare correction decisions in batches. Corrections may affect software, Symbiospec, tests, or a combination. Use existing authorization; request decisions only where needed. Defer findings requiring further investigation and return revised product meaning for human review.

## 4. Apply authorized corrections

Preserve approved intent while applying authorized changes. Do not rewrite the specification simply to match a regression, or reinitialize the entire structure to fix a local difference. Keep software compatibility and unrelated documentation intact.

## 5. Verify the result

Repeat the affected comparisons and appropriate implementation checks. Update the report, decisions, indexes, and coverage with resolved and unresolved findings. Report the actual scope verified; no difference found in one area does not prove that the entire software matches Symbiospec.
