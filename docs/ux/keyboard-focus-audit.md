# Keyboard and focus audit (QA-002)

All browser evidence below uses explicit fixtures (`BROWSER-FIXTURE`); it does not assert live identity, tenant membership or backend behavior.

| Flow | Keyboard evidence | Remaining / N/A |
|---|---|---|
| Operations search, brief, map, timeline, data mode | `e2e/dashboard-keyboard.spec.ts`: click, Enter, Space and Ctrl/Meta+K search; Escape and focus return for search/brief; Space for map/mode; keyboard focus on timeline. | Live role/tenant session is `NEEDS-LIVE`; keyboard behavior is covered in fixture. |
| Load list | `e2e/keyboard-focus-overlays.spec.ts`: Enter opens the Create modal, focus enters and stays inside during Tab/Shift+Tab, Escape closes it and restores focus to the exact trigger. | Live CRUD permission/backend session is `NEEDS-LIVE`. |
| Load detail | Same spec: Enter selects the timeline tab and renders its panel. | N/A for modal/drawer focus trap and trigger restoration: the Load detail route has no overlay in this flow (`.ant-modal, .ant-drawer` count is asserted as zero). |
| AI Dispatch run | Same spec: keyboard reaches mode and UUID fields; Enter submits the fixture action and exposes the result. | The run form is inline, not an overlay; modal focus trap/restore is N/A. Backend execution is not verified. |
| AI Dispatch approve | Same spec: Space opens the real confirmation modal; focus enters and remains in the modal during Tab/Shift+Tab; Escape closes and restores its trigger. | Live approval/UAT is `NEEDS-LIVE`. |
| Optimization confirmation | Same spec: Enter opens the existing confirmation modal; focus containment, Escape close and exact trigger restoration are asserted. | Live command execution is `NEEDS-LIVE`. |
| Optimization candidate drawer | Same spec: Enter opens the existing drawer; focus containment, Escape close and trigger restoration are asserted. | Live candidate data is `NEEDS-LIVE`. |
| Documents drawer | Same spec: Enter opens the existing detail drawer; focus containment, Escape close and trigger restoration are asserted. | Live document access is `NEEDS-LIVE`. |
| Notifications popover | Same spec: Space opens the popover, focus moves into its content, Tab leaves it while the popover stays open, Escape closes it and returns focus to the trigger. | N/A for Tab trapping: this is a non-modal popover (`aria-modal` is absent), so trapping focus would break normal page navigation. Live notification permissions/data are `NEEDS-LIVE`. |
| Sidebar / finance submenu | `e2e/sider-role.spec.ts` checks rail keyboard navigation; `e2e/keyboard-focus-overlays.spec.ts` uses Enter/Escape and exact trigger restoration for the ACCOUNTANT finance submenu. `AppSider.test.tsx` covers the role matrix. | Real role/tenant authorization is `NEEDS-LIVE`. |

`npx playwright test e2e/keyboard-focus-overlays.spec.ts e2e/loads-route-states.spec.ts e2e/sider-role.spec.ts e2e/reduced-motion.spec.ts --workers=1 --reporter=line` — exit 0, 19/19 passed. `npx vitest run src/tests/features/notifications/NotificationHeaderIcon.integration.test.tsx --maxWorkers=1 --minWorkers=1 --reporter=dot` — exit 0, 5/5 passed after scoping the nested confirmation by its `.ant-modal-title`.

**QA-002 result: all requested UI flows have a browser keyboard test or a reasoned N/A.** The only unverified items are live role/tenant permissions and live backend outcomes, which are outside keyboard interaction acceptance.
