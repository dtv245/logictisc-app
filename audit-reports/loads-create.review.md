STATUS: CHANGES_REQUESTED

# Review độc lập — loads-create

Các kết luận chính về route/action, POST trả 201, permission Load và ACCOUNTANT không truy cập được `GET /api/employees`, persistence gap của terminal, validation API và duplicate data nhìn chung khớp source. Báo cáo cũng phân biệt source review với automated/E2E test và không còn gộp container feature gate vào bug terminal.

## Vấn đề cần sửa

1. **TC-LC-10 trỏ tới file không tồn tại — báo cáo dòng 206.** `resourceFormBackendErrors.ts` không có trong source. Helper là `src/forms/backendFieldErrors.ts:97–109`, được nối vào LoadCreate tại `src/pages/loads/create.tsx:26–28`. Test `src/tests/components/resourceFormBackendErrors.test.tsx` kiểm tra các generic resource forms, không phải integration riêng của LoadCreate. Sửa đường dẫn và giữ trạng thái `SOURCE_REVIEWED` cho phần nối dây chưa được test trực tiếp.

2. **Tham chiếu tọa độ sai dòng — báo cáo dòng 203.** Báo cáo dẫn `AddressFields.tsx:156, 175` cho hai giới hạn GPS. Dòng 156 là `min={-90}`; 175 là dòng đóng `InputNumber`, không phải giới hạn longitude. Source đúng là `src/forms/AddressFields.tsx:156–157` cho latitude và `171–172` cho longitude.

3. **Tham chiếu trường ghi chú sai dòng — báo cáo dòng 47, 212, 265 và 375.** Các chỗ này dẫn `LoadForm.tsx:161` như dòng chứa `notes`/`Input.TextArea`, nhưng dòng 161 chỉ là `<Col span={24}>`. Field nằm tại `src/features/loads/components/LoadForm.tsx:162–167` (Form.Item và TextArea). Cập nhật các trích dẫn để người đọc kiểm chứng được nhận định `maxLength`.

## Đã đối chiếu

- Terminal ID được nhận trong DTO nhưng không được resolve/map vào entity: `/home/vumoi/logictics_api/src/main/java/com/company/logicstic/dto/load/CreateLoadRequest.java:28–29`, `.../service/LoadService.java:138–155`, `.../mapper/LoadMapper.java:17–35`.
- `containers` không có trong frontend API registry; báo cáo đã giới hạn đây là feature/config mismatch và ghi runtime chưa xác minh, không xem việc thiếu tính năng container tự thân là bug.
- Duplicate `name`/`externalSourceId` không có unique constraint; test duplicate được đánh dấu source-reviewed, không tuyên bố đã chạy E2E.
- Test execution section ghi rõ các kịch bản source-reviewed chưa chạy bằng live automated tests. Tôi không chạy lại build/test trong lượt review này.
