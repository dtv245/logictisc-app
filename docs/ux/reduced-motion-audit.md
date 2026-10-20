# Reduced motion audit (QA-005)

- Inventory command: `rg -n 'transition|animation|@keyframes|scroll-behavior' src --glob '*.{css,scss,tsx,ts}'` — 69 matches across 28 source/test/type files. The inventory includes stylesheet declarations and inline React styles; matches in tests/types are not runtime motion.
- `src/styles/global.scss` applies `scroll-behavior: auto`, `animation-duration: 0.01ms`, one animation iteration, and `transition-duration: 0.01ms` with `!important` to every element and pseudo-element when `prefers-reduced-motion: reduce` is active. This also overrides inline transition/animation declarations.
- More specific reduced-motion rules exist in `src/components/AppSider.scss`, `src/table/BaseTable.scss`, and `src/features/operations/styles/operations.scss`; they remove transitions for those components.
- Browser verification: `npx playwright test e2e/reduced-motion.spec.ts --workers=1 --reporter=line` — exit 0, 2/2. It emulates `reduce` and checks dashboard interactions and the navigation rail.
- No motion library was added and no camera zoom/rotation animation was introduced. Evidence is `BROWSER-FIXTURE`, not live.
