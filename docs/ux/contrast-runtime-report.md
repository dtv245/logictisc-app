# Runtime contrast report — DS-003 / QA-003

Date: 20/10/2026. Evidence uses Chromium Playwright fixtures, not a live tenant.

## Method

`e2e/contrast-runtime.spec.ts` measures visible text using runtime `getComputedStyle`, walks ancestor backgrounds and composites alpha, and measures interactive control borders/icons plus keyboard `:focus-visible` indicators. It applies WCAG thresholds of 4.5:1 for regular text, 3:1 for large text, controls and focus indicators. Every gradient/image/unknown background and every disabled exemption is retained in the JSON output with its selector and reason. The scanner was written locally; `@axe-core/playwright` was not added because this report needs explicit selector-level alpha compositing and indeterminate reasons.

The scan covers Operations, Loads list, Load detail, AI Dispatch, Optimization, Documents, Fleet and the sidebar. `e2e/fixtures/assertNoRawTranslationKeys.ts` guards the page content before results are recorded.

## Baseline comparison

The same spec and fixture files were run at `da5c600` in a temporary worktree (with `node_modules` symlinked), then at the current HEAD. The temporary worktree was removed after the run.

| Run | Entries | Measured pairs | Failing pairs | Indeterminate |
|---|---:|---:|---:|---:|
| `da5c600` | 505 | 463 | 161 | 42 |
| Current HEAD | 507 | 495 | 5 | 12 |

Of the shared selector groups (`screen + selector + kind`), 405 were present in both runs, 27 are new at HEAD, and 5 baseline selectors are no longer present. Comparison uses the minimum measured ratio for each shared selector group: **0 groups are worse at HEAD**. Operations and Load detail, the two DS-003 edited screens, have **zero failing measured pairs**. The baseline and HEAD JSON outputs were kept in `/tmp/contrast-baseline-final.json` and `/tmp/contrast-head-final.json`; they are temporary test outputs, not repository artifacts.

## Remaining failures

Five current failures all involve the existing primary blue `#1677ff`. No primary color was changed. They remain proposals for a separately approved primary-color decision, so QA-003 stays `IN_REVIEW`.

| Screen | Selector | Ratio / threshold | Pair |
|---|---|---:|---|
| Loads list | `div.resource-list-toolbar__right:nth-of-type(2) > div.resource-list-toolbar__primary-action:nth-of-type(3) > a > button.ant-btn > span:nth-of-type(2)` | 4.104 / 4.5 | White text on primary blue, Create action |
| Loads list | `div > div > ul.ant-pagination > li.ant-pagination-item:nth-of-type(3) > a` | 4.104 / 4.5 | Primary blue page number on white |
| AI Dispatch | `div.ant-tabs-tab:nth-of-type(1) > div.ant-tabs-tab-btn > div.ant-space > div.ant-space-item:nth-of-type(2) > span` | 3.641 / 4.5 | Primary blue selected-tab text on warm surface |
| Optimization | `div.ant-card > div.ant-card-body:nth-of-type(2) > form.ant-form > button.ant-btn > span` | 4.104 / 4.5 | White text on primary blue, Run action |
| Fleet | `div.ant-col:nth-of-type(1) > label > div > button.ant-btn > span` | 4.104 / 4.5 | Primary blue “All vehicles” on white |

The non-primary token issues found during the scan were fixed: low-contrast focus rings now use `--color-focus-indicator`, Fleet DatePicker borders use `--color-control-boundary`, and picker icons use `--color-text-secondary`. Text ink and breadcrumb colors were corrected so shared selector contrast did not regress. The primary token remains unchanged.

## Indeterminate entries

There are 12 indeterminate entries. Each is retained here rather than counted as passing:

| Screen / selector | Reason and disposition |
|---|---|
| Load detail `div.truck-showcase:nth-of-type(2) > div.truck-showcase__callouts:nth-of-type(2) > div.truck-showcase__callout:nth-of-type(1) > div:nth-of-type(2) > div.truck-showcase__callout-value:nth-of-type(1)` | Opaque linear gradient from `rgb(248, 250, 252)` to `rgb(241, 245, 249)`; endpoint ratios 18.048:1 and 17.237:1. Kept indeterminate because gradient backgrounds require explicit review. |
| Load detail `div.truck-showcase:nth-of-type(2) > div.truck-showcase__callouts:nth-of-type(2) > div.truck-showcase__callout:nth-of-type(1) > div:nth-of-type(2) > div.truck-showcase__callout-label:nth-of-type(2)` | Same gradient; endpoint ratios 7.243:1 and 6.917:1. Kept indeterminate for gradient review. |
| Load detail `div.shipment-card:nth-of-type(1) > div.truck-showcase:nth-of-type(2) > div.truck-showcase__callouts:nth-of-type(2) > div.truck-showcase__callout:nth-of-type(2) > div:nth-of-type(2) > div.truck-showcase__callout-label:nth-of-type(1)` | Same gradient; endpoint ratios 7.243:1 and 6.917:1. Kept indeterminate for gradient review. |
| Load detail `div.shipment-card:nth-of-type(1) > div.truck-showcase:nth-of-type(2) > div.truck-showcase__callouts:nth-of-type(2) > div.truck-showcase__callout:nth-of-type(2) > div:nth-of-type(2) > div.truck-showcase__callout-value:nth-of-type(2)` | Same gradient; endpoint ratios 18.048:1 and 17.237:1. Kept indeterminate for gradient review. |
| Loads list `div > ul.ant-pagination > li.ant-pagination-prev:nth-of-type(2) > a > button.ant-pagination-item-link`; `div > ul.ant-pagination > li.ant-pagination-next:nth-of-type(4) > a > button.ant-pagination-item-link` | Disabled pagination controls expose disabled semantics; WCAG exempts inactive controls from non-text contrast. |
| Optimization `div.ant-card-head:nth-of-type(1) > div > div:nth-of-type(2) > button.ant-btn > span`; `div.ant-card > div.ant-card-head:nth-of-type(1) > div > div:nth-of-type(2) > button.ant-btn` | Disabled “Remove” action; text and boundary are exempt while disabled semantics are exposed. |
| Documents `div.documents-dropbox-view > div:nth-of-type(7) > ul.ant-pagination > li.ant-pagination-prev:nth-of-type(2) > button.ant-pagination-item-link`; `div.documents-dropbox-view > div:nth-of-type(7) > ul.ant-pagination > li.ant-pagination-next:nth-of-type(4) > button.ant-pagination-item-link` | Disabled pagination controls expose disabled semantics; WCAG exempts inactive controls from non-text contrast. |
| Fleet `div.ant-card-body > form.ant-form > div:nth-of-type(3) > button.ant-btn:nth-of-type(2) > span`; `button[aria-label="Load Report"]` | Disabled “Load Report” action; text and boundary are exempt while disabled semantics are exposed. |

The scanner found no other background image, alpha-compositing or unparsed-background indeterminates at HEAD. Disabled entries are semantic exemptions; gradient text endpoints exceed their applicable threshold, but the entries remain explicitly indeterminate as required.

## Evidence and outcome

- Command: `RUNTIME_CONTRAST_REPORT=/tmp/contrast-head-final.json npx playwright test e2e/contrast-runtime.spec.ts --workers=1 --reporter=line` — exit 0, 1 spec passed; report contains 495 measured pairs.
- Screenshot command: `SCREENSHOT_DIR=ds003-after npx playwright test e2e/capture-demo-baseline.spec.ts e2e/dashboard-panels.spec.ts e2e/loads-show-screenshot.spec.ts e2e/priority-shipment-card.spec.ts e2e/sider-role.spec.ts --workers=1 --reporter=line` — exit 0, 9/9. The writers guard against raw translation keys before capture. Screenshots are `BROWSER-FIXTURE`.
- No current contrast failure is on the Operations or Load detail screens edited for DS-003; shared matched selectors do not regress. DS-003 can close with the runtime comparison documented. QA-003 remains `IN_REVIEW` because the five primary-blue text pairs are below WCAG text contrast and changing that brand color was not authorized.
