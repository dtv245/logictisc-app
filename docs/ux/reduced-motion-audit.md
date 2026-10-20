# Reduced motion audit (QA-005)

- Inventory command: `rg -n 'transition|animation|@keyframes|scroll-behavior' src --glob '*.{css,scss,tsx,ts}'` — 69 matches across 28 source/test/type files. The inventory includes stylesheet declarations and inline React styles; matches in tests/types are not runtime motion.
- `src/styles/global.scss` applies `scroll-behavior: auto`, `animation-duration: 0.01ms !important`, `animation-iteration-count: 1 !important`, and `transition-duration: 0.01ms !important` when `prefers-reduced-motion: reduce` is active. There is no `animation: none` or `transition: none` rule.
- More specific reduced-motion rules exist in `src/components/AppSider.scss`, `src/table/BaseTable.scss`, and `src/features/operations/styles/operations.scss`; each uses the short duration/one-iteration pattern.
- `rg -n 'animationend|transitionend' src --glob '*.{css,scss,tsx,ts}'` finds no source listeners or dependencies on end events.
- Browser verification: `npx playwright test e2e/reduced-motion.spec.ts --workers=1 --reporter=line` — exit 0, 3/3. It emulates `reduce`, checks dashboard and rail transition durations, opens/closes Modal, Drawer, Popover, Dropdown, Select and Tooltip within one second, and confirms spinner/skeleton remain visible.
- No motion library was added and no camera zoom/rotation animation was introduced. Evidence is `BROWSER-FIXTURE`, not live.
