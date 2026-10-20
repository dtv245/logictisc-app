# Ma trận trạng thái component dùng chung

Ma trận này mô tả trách nhiệm của từng component; trạng thái `N/A` nghĩa là component không sở hữu hành vi đó. Component cha chịu trách nhiệm ghép loading/error/disabled với nút hoặc form khi cần.

| Component | Default | Loading | Error | Disabled | Focus |
|---|---|---|---|---|---|
| Button (Ant Design 5) | `Button and Card state matrix`: nội dung và click hoạt động | Cùng test: spinner loading xuất hiện | N/A: lỗi thuộc Form/AsyncState/Modal; Button chỉ nhận trạng thái | Cùng test: button disabled không nhận thao tác | Cùng test kiểm tra focus keyboard; browser `dashboard-keyboard.spec.ts` xác nhận focus-visible 2px |
| StatusTag | `StatusTag.test.tsx`: status role, nhãn và neutral tone | N/A: tag là thông tin tĩnh | `StatusTag.test.tsx`: error tone là semantic state, không có action | N/A: không nhận tương tác | N/A: không nằm trong thứ tự Tab |
| Card / OpsCard | `ControlStates.test.tsx`: title/content hiển thị | N/A: Card không nhận async state; caller render skeleton/AsyncStateView | N/A: caller render error state riêng | N/A: container tĩnh | N/A: Card không focusable trừ khi caller thêm control |
| Modal / Drawer | `ConfirmActionModal.test.tsx`: mở và submit action | `ConfirmActionModal.test.tsx`: pending khóa trigger và confirm cho tới khi promise settle | `ConfirmActionModal.test.tsx`: lỗi giữ dialog mở và cho thử lại | `ConfirmActionModal.test.tsx`: trigger disable không mở dialog | Browser `dashboard-keyboard.spec.ts`: Escape đóng brief/search modal và focus trở lại trigger; Drawer focus trap/restore còn kiểm toán ở QA-002 |
| Form / Form field | `src/tests/components/resourceFormFieldsLayout.test.tsx`: field render theo schema | N/A: tải form thuộc page state, không phải field | `src/tests/components/resourceFormBackendErrors.test.tsx`: API field errors hiển thị | `src/tests/components/resourceFormReadOnly.test.tsx`: field readonly/disabled | `src/tests/components/ResourceCreateModal.test.tsx`: mở section lỗi và focus field; browser focus-visible kiểm tra control chung |
| AsyncStateView | `src/components/AsyncState.test.tsx`: populated data | Test kiểm tra busy/loading và không render data sớm | Test kiểm tra alert + retry hoạt động | N/A: wrapper không có disabled prop; retry button hỗ trợ disabled theo `retrying` | Retry là button native trong thứ tự Tab; browser keyboard flow kiểm tra focus-visible của nút Operations |

## Giới hạn

- API `StatusTag` và `OpsCard` không có loading/disabled/focus API; thêm các trạng thái đó sẽ tạo semantics sai cho component trình bày tĩnh.
- QA-002 tiếp tục kiểm toán restore focus trên từng modal/drawer/popover ưu tiên; ma trận này không thay cho kiểm tra các flow đó.
- Không tạo component song song: tiếp tục dùng Ant Design Button/Form/Modal và các `AsyncStateView`, `StatusTag`, `OpsCard` đang có.
