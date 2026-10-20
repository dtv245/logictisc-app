# Keyboard and focus audit (QA-002)

Evidence below separates browser-fixture checks from source and component tests. A component that implements a handler is not counted as a keyboard test unless a test exercises that behavior.

| Flow | Evidence in this run | Remaining criterion |
|---|---|---|
| Operations search, brief, map, timeline, data mode | `e2e/dashboard-keyboard.spec.ts`: real browser Click/Enter/Space/Ctrl+K, Escape, focus return for search/brief, Space for map/mode, timeline focus. `BROWSER-FIXTURE`. | No Operations live role/tenant session (`NEEDS-LIVE`). |
| Load list/detail | `src/tests/components/ResourceListPage.test.tsx`, `src/tests/pages/loads/LoadShow.test.tsx`; `ResourceModalFrame.tsx` has first-input focus and trigger restoration. | No browser test for Load list edit/show modal Tab/Enter/Space/Escape + focus return, nor keyboard tab switching on the live Load detail route. |
| AI Dispatch run/approve | `src/tests/pages/ai-dispatch/AiDispatchPage.test.tsx` tests run, approve/reject, permission and API errors. | No browser keyboard sequence for Run/Approve/Reject modal and focus restoration after Escape/cancel. |
| Optimization confirmation/candidate drawer | `src/tests/pages/optimization/OptimizationPage.test.tsx`, `OptimizationRunShow.test.tsx`; source `OptimizationCandidateDrawer.tsx` restores trigger focus on close. | No browser test for keyboard opening/closing and restored focus for either confirmation modal or candidate drawer. |
| Documents drawer | `src/tests/features/documents/DocumentDropboxView.test.tsx` and `DocumentDropboxDrawer.test.tsx` exercise pointer open/delete behavior. | No keyboard open, Escape close, and trigger-focus restoration test. |
| Notification popover | `src/tests/features/notifications/NotificationHeaderIcon.integration.test.tsx` exercises pointer opening and persisted actions. | No Tab/Enter/Space/Escape sequence or focus-return test for the popover. |
| Sidebar | `src/tests/components/AppSider.test.tsx` checks role visibility/current labels; `e2e/sider-role.spec.ts` checks rail ArrowDown for ADMIN and role fixtures. | A full tab-order/focus-return path for nested submenu and notification popover remains untested. |

**QA-002 status:** `IN_REVIEW`. Existing implementation and fixture evidence cover Operations and rail navigation, but the listed Load, AI, Optimization, Documents, and Notifications keyboard/focus flows do not yet have browser tests for the complete key sequence and focus restoration. No live auth/tenant session was available.
