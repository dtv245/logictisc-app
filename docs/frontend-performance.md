# FE-PERF-001 — Measured feature loading (2026-10-05)

Status: DONE for current runtime-ready feature splitting. Optimization is not implemented or exposed while BE-029 blocks its runtime contract. No framework, Vite configuration, dependency-version or manual chunk changes.

## Change and existing boundaries

DashboardPage now dynamically imports FinancialSection, which owns Recharts, under a local Suspense boundary. Existing localized section title/question and Ant Design Skeleton remain visible while that module loads. Other executive sections and existing reporting queries render independently. No change to executive.queries.ts, executive.metrics.ts, API calls, metrics or filter semantics.

Existing Dashboard/Operations/Payroll/Payslip route lazy imports remain valid. VehicleTrackingMap already imports Leaflet dynamically only with actual points and cleans up map instances; existing map tests retained. OperationsChart is lightweight HTML/CSS, so adding another asynchronous boundary would offer little benefit.

## Before/after build evidence

The script parses emitted static JS imports and sums each graph closure. “Additional” excludes files already in the bootstrap static closure. Dynamic modules and CSS are excluded. Gzip is summed per asset. These are dependency/bundle measurements, not browser timing or full route-complete payload measurements; Recharts still downloads when the mounted financial section requests it.

| Measurement | Before | After |
|---|---:|---:|
| Dashboard additional static JS | 445,978 bytes | 52,924 bytes |
| Dashboard additional gzip JS | 124,760 bytes | 15,193 bytes |
| Bootstrap static JS | 2,570,990 bytes | 2,572,067 bytes |
| Bootstrap summed gzip JS | 820,894 bytes | 822,593 bytes |
| Largest emitted JS chunk | 505,644 bytes | 470,110 bytes |

Dashboard's additional static graph falls by 393,054 bytes (88.1%); the chart graph is deferred. Bootstrap is approximately unchanged (+1,077 bytes); this change does not claim a startup-speed improvement. The new FinancialSection chunk is 394,371 bytes, and its static graph adds 404,871 bytes beyond bootstrap. The current build emits no >500 kB chunk warning; neither warning limits nor bundler chunk rules were altered.

Evidence artifacts: [before](frontend-bundle-before.json), [after](frontend-bundle-after.json).

Reproduce on a built checkpoint:

```bash
npm run build
node scripts/measure-frontend-bundle.mjs dist docs/frontend-bundle-after.json
```

The measurement script uses es-module-lexer already installed by the Vite toolchain; no production dependency was added. Feature roots DashboardPage, OperationsDashboardPage, PayrollRunShow, PayslipShow, FinancialSection and leaflet-src were verified absent from the bootstrap graph; FinancialSection is absent from Dashboard's static graph.

## Verification

- typecheck PASS; lint PASS; build PASS.
- Dashboard data, executive metrics and Leaflet targeted tests: 3 files / 8 tests PASS.
- Full unit/integration suite: 102 files / 542 tests PASS, no removal or timeout increase.
- Browser E2E/timing NOT RUN: shared authenticated identity GET /api/me is absent (BE-021). Production/perceived performance is not certified by these bundle measurements.
