# Audit phân trang frontend LogisticsX

Ngày audit: 2026-10-28  
Phạm vi: các hook/list/table trong `src/`, data provider, API backend hiện có được kiểm tra chỉ đọc. Chưa sửa source trước khi hoàn tất audit.

## Tóm tắt

- Các màn CRUD dùng `ResourceListPage` đã bật server pagination, URL sync, search debounce 300 ms, `rowKey="id"` và giữ layout bảng. Tuy nhiên page size mặc định hiện là 25, dropdown có option 25, chưa cấu hình `keepPreviousData`, stale time hoặc prefetch trang kế tiếp.
- Provider gửi `page` 1-based, `pageSize`, đọc `items` và `totalItems` từ `PagedResponse`; Axios nhận `AbortSignal` của TanStack Query và có hủy request list cũ cùng key. Backend `PaginationValidator` chuyển page 1-based thành Spring index 0-based và `PagedResponse.currentPage` trả 1-based. Quy ước này đang khớp, không cần đổi provider.
- Ngoại lệ có chủ đích ở backend: `/api/payroll/reconciliation-cases`, `/api/ai/runs` và `/api/ai/dispatch/sessions` dùng Spring `page` 0-based; frontend payroll reconciliation đổi `current - 1` đúng nhưng page size mặc định 25, chưa URL-sync/keep-previous/prefetch.
- Settlements, driver pay policies, payslips, profitability, fleet health, một số lịch sử AI và tab containers đang nhận mảng đầy đủ rồi phân trang cục bộ hoặc không phân trang. Một số endpoint backend hiện chỉ trả list/mảng; cần bổ sung hợp đồng phân trang phía backend trước khi frontend chuyển sang server pagination.
- Không thấy `useInfiniteList`. Không có số đo React Profiler hoặc thời gian phản hồi thực tế trong môi trường audit; các giá trị đó được ghi `NOT MEASURED`, không suy đoán.

## Danh sách màn hình và danh sách phân trang

| Màn hình | Cách phân trang hiện tại | Page size hiện tại | Debounce search? | Re-render / trạng thái chuyển trang |
|---|---|---:|---|---|
| Payments (`/payments`) | Server qua `ResourceListPage` / `useTable` | Mặc định 25; options 10,20,25,50,100; provider max 100 | Có, 300 ms nếu search control được cấu hình cho resource | Không có `keepPreviousData` / prefetch / staleTime; query đổi trang có thể đổi dataSource trong lúc bảng loading. Columns qua `useLocalizedColumns` và `BaseTable` memo. |
| DVIR (`/dvir`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên; `rowKey` mặc định `id`, `fitToShell` giữ chiều cao bảng. |
| Accidents (`/accidents`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Loads (`/loads`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms | Như trên; đây là một trong các danh sách cần ưu tiên tối ưu. |
| Load board (`/load-board`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Expenses (`/expenses`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Trips (`/trips`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms | Như trên; cần ưu tiên sau loads. |
| Drivers (`/drivers`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Trucks (`/trucks`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Invoices (`/invoices`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên; cần ưu tiên sau loads/trips. |
| Maintenance (`/maintenance`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Notifications (`/notifications`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| HOS/ELD (`/hos-eld`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Employees (`/employees`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Customers (`/customers`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Containers (`/containers`) | Server qua `ResourceListPage` | Như trên | Có, 300 ms nếu có search control | Như trên. |
| Products (`/products`) | Server qua `useTable`, URL sync | Refine default (không khai báo riêng; provider fallback 25) | Không debounce; Refine search form gửi khi submit | Không có `keepPreviousData`/prefetch/staleTime; `columns` được tạo qua `useProductColumns`; cần kiểm tra rowKey và loading trạng thái. |
| Terminals (`/terminals`) | Server qua `useTerminalList`; `TerminalCardGrid` hiển thị `List` | Mặc định 25; options do List/AntD tự cấu hình, không khai báo pageSizeOptions | Có, 300 ms qua `ResourceListToolbar` | URL sync và `isFetching` toolbar có; chưa có keep-previous/prefetch/staleTime; chế độ preview DEV dùng mảng fixture và pagination cục bộ. |
| Documents (`/documents`) | API `useTable` server, nhưng search/type/status/sort đang lọc cục bộ trên trang đã tải | Refine default; URL có thể chứa pageSize=10; custom options 10,20,50 | Không debounce search hiện có | Kết quả filter chỉ trên trang hiện tại làm tổng/paging không phản ánh toàn tập; chưa reset page sau mọi filter; `loading` gộp `isLoading || isFetching`, có nguy cơ làm mất cảm giác giữ trang. |
| Settlements | API trả `List<DriverSettlementView>`; lọc/search và pagination đều ở client | Mặc định 15; options 10,15,25,50 | Không, lọc ngay theo mỗi phím | Tải toàn bộ settlements, không URL state/keep-previous/prefetch; columns được memoized. Backend `GET /api/driver-settlements` không nhận page/pageSize. |
| Driver pay policies | API trả `List<DriverPayPolicyView>`; grouping/filter/search/pagination ở client | Mặc định 15 | Không, lọc ngay theo mỗi phím | Tải toàn bộ policies; không URL state/keep-previous/prefetch; columns có memo hóa. Backend `GET /api/driver-pay-policies` không nhận page/pageSize. |
| Payslips của tôi | API trả `List<PayslipView>`; pagination client | Mặc định 10 | Không có search | Tải toàn bộ payslips; page-level spinner che toàn nội dung trong lúc fetch; không URL state/keep-previous. Backend `/api/driver/me/payslips` trả list. |
| Payroll reconciliation | Server qua `useCustom`; backend Spring page 0-based, frontend đổi sang current 1-based | Mặc định 25; size change reset trang 0; options AntD mặc định | Không có search | Loading nằm trong Table nhưng chưa cấu hình keep-previous/staleTime/prefetch/URL; `columns` tạo inline mỗi render. Row key là `caseEventId`. |
| Bến bãi > Containers | Request `/api/containers?currentTerminalId=…` không truyền pagination; Table cắt ở client | Mặc định 10, có size changer nhưng không options/max rõ | Không có search | Mảng toàn bộ (hoặc response `items`) được tải; không URL state/keep-previous. Không tìm thấy controller container tương ứng trong backend source đã kiểm tra để xác nhận pagination/filter contract. |
| Lịch sử AI (`AiRunHistoryDrawer`) | Hook gọi `/api/ai/runs` không truyền page/size; Table cắt ở client | Mặc định 10 | Không có search | Backend đã có `GET /api/ai/runs` dạng `PagedResponse`, `page` 0-based, `size` mặc định 20; frontend hiện đọc payload như `AiRun[]`, chưa xử lý `items/totalItems` nên cần sửa mapper/hook theo response thật. |
| Lịch sử điều phối AI | Table phân trang cục bộ trên `actions.plans` | Mặc định 10 | Không có search | Đây là response của một lần chạy; backend còn có `/api/ai/dispatch/sessions` phân trang 0-based, nhưng cần xác định UI đang muốn danh sách plans của lần chạy hay session history trước khi thay nguồn dữ liệu. |
| Fleet health | Client pagination qua `BaseTable` trên `report.coverage` | Mặc định 20; options 10,20,50,100 | Bộ lọc chỉ xe có vấn đề lọc client | Toàn bộ report coverage đã tải trước khi cắt trang; chưa URL state/keep-previous; columns cần kiểm tra memo hóa ở component cha. Cần backend xác nhận giới hạn response hoặc API paging. |
| Fleet chart utilization | Client slice trước khi render biểu đồ | 10; không có size changer | Không | Mảng `report.coverage` đã tải toàn bộ; chart chỉ render 10 xe mỗi trang. Không thay đổi phân trang table nhưng cùng phụ thuộc report response lớn. |
| Profitability by load | Backend trả array report; Table pagination client | Mặc định 10 | Filter submit theo nút Apply, không debounce | Tải toàn bộ report theo filter; `columns` tạo inline mỗi render; không URL state/keep-previous. Backend endpoint được kiểm tra trả report array, chưa có paging contract. |
| Optimization candidates | Client pagination trên kết quả của một lần chạy | Mặc định 20 ở hai bảng | Không có search | Response candidates tải trước; kích cỡ bị giới hạn chưa được xác minh. Cần xác nhận backend giới hạn candidate count hoặc bổ sung paging. |

## Danh sách không phải màn danh sách chính

Các bảng sau được dùng trong detail/panel/widget; không coi là màn danh sách phân trang cấp route. Kiểm tra giới hạn nghiệp vụ/backend trước khi đổi sang pagination:

| Vị trí | Hành vi hiện tại | Nhận xét |
|---|---|---|
| Load documents panel | `useList`, server page 20, total từ provider; pager riêng | Server pagination đã có; nên dùng loading `isFetching`, reset trang khi loadId đổi và chuẩn hóa pager dùng chung. |
| Shipment documents card | `useList` page 5, recent documents, không pager | Giới hạn 5 là hợp lý cho widget. |
| Notification header | `useList` page 1 size 5 | Widget giới hạn nhỏ, không cần pager. |
| Dashboard counts / executive existence checks | `useList` page size 1 | Query count/existence, không tải danh sách đầy đủ. |
| Accessorials, shipment costs, settlement lines/adjustments, payroll items/payments, customer report table và các bảng detail optimization | `pagination={false}` hoặc mảng chi tiết | Có thể tăng theo giao dịch/parent; không đủ bằng chứng về giới hạn. Xác nhận backend/contract trước khi áp dụng quy tắc danh sách lớn. |
| Trip driver assignments, payroll validation, FSC preview | List/table lồng trong một trip/run/preview | Dữ liệu theo một aggregate; giới hạn chưa được xác nhận. Không thấy request theo từng dòng trong các component đã kiểm tra. |

## Select/autocomplete

`EntityPicker` dùng Refine `useSelect`, debounce 300 ms, `onSearch` tạo filter `search contains`, `filterOption={false}` nên có tìm kiếm server và không lọc lại trên browser. Tuy nhiên pageSize hiện là optional nên nhiều call site không khóa giới hạn 50; `TerminalSelect` truyền `pageSize={100}`, vượt yêu cầu. Cần chuẩn hóa `pageSize <= 50` và mặc định rõ ràng 50 hoặc thấp hơn, đồng thời bảo đảm backend search theo `search` trên resource tương ứng.

Settlement filter/modal hiện dùng `useDrivers()` gọi `/api/drivers?page=1&pageSize=100` và sau đó tạo options cục bộ; đây là 100 option cố định, không server search theo input. Cần chuyển sang picker tìm kiếm server tối đa 50 (endpoint `/api/drivers` đã có search và pagination theo code backend).

## Data provider và backend page contract

- `serializeListQuery()` gửi `page=normalizePage(current)` (1-based) và pageSize; page size bị clamp ở 100.
- `DataProvider.getList()` đọc `items` và `totalItems` từ `PagedResponse`; `total` của Refine lấy từ `totalItems`.
- `meta.queryContext.signal` được chuyển vào Axios `signal`; request coordinator abort request cũ cùng resource/query key.
- Backend `PaginationValidator.pageRequest(page,size,sort)` trừ 1 khi tạo Spring `PageRequest`; `PagedResponse.from(Page)` cộng 1 vào `currentPage`. Không đổi provider.
- Payroll reconciliation và hai API AI dùng page index 0-based + size; frontend phải truyền quy ước endpoint riêng, không đưa chúng qua serializer 1-based nếu không có adapter rõ ràng.
- Endpoint server-paged đã xác minh gồm CRUD resources (ví dụ loads/trips/invoices/customers/drivers/documents), `/api/payroll/reconciliation-cases`, `/api/ai/runs`, `/api/ai/dispatch/sessions`. API settlements/pay policies/payslips hiện trả list. Terminal container endpoint chưa tìm được controller tương ứng trong backend source.

## Anti-pattern và mức độ

### P0 — sai hợp đồng phân trang hoặc tải toàn tập

1. Settlements, policies, payslips: toàn bộ dữ liệu về client rồi mới lọc/cắt trang; API hiện chưa nhận page/pageSize.
2. Documents: API server-paged nhưng filter/search chỉ áp dụng trên page đã tải.
3. AiRunHistory: API backend đã trả `PagedResponse` nhưng frontend gọi không tham số paging và hiểu response như array.
4. Terminal containers: request không có page/pageSize nhưng Table phân trang cục bộ; backend pagination contract chưa xác minh.
5. Select tài xế settlement pageSize 100 và không search server.

### P1 — mượt và kiểm soát item count

1. Shared default pageSize 25, dropdown có 25; cần chuyển default 20, options `[10,20,50,100]`.
2. Không có `keepPreviousData`, prefetch next hoặc staleTime nhất quán ở list pages; page transition có thể nháy nội dung.
3. Payroll reconciliation pageSize 25 và không URL sync; `columns` inline.
4. `EntityPicker` không ép max 50; TerminalSelect gửi 100.
5. `showTotal` hiện không bổ sung từ “mục”; documents dùng dấu gạch ngang ASCII và “tài liệu”.
6. `FleetHealthTable`, profitability, AI runs/history, optimization candidate tables render arrays đã tải từ trước bằng client pagination.

### P2 — render/đo đạc cần xử lý sau khi sửa paging

- `ResourceListPage` dùng column definitions qua memoized localization; `BaseTable` memo hóa processed columns, và mặc định rowKey là `id`. Đây là nền tảng tốt.
- Products, payroll reconciliation, profitability và một số bảng inline tạo columns trong render; nên memo hóa trong component/hook khi chuẩn hóa list.
- Không ghi nhận request theo từng dòng trong các màn đã kiểm tra.
- Table/list nested không có `rowKey` tường minh cần kiểm tra component cụ thể; `BaseTable` mặc định `id`, còn table detail nhiều nơi chỉ khai báo khi cần.

## Đo đạc trước khi sửa

Số request đổi trang bên dưới là kỳ vọng tĩnh từ cấu hình query (không phải đo network): list server thông thường tạo 1 request khi đổi trang; hiện chưa có prefetch trang kế tiếp. Thời gian thực và số render cần React DevTools Profiler + API chạy có dữ liệu, chưa có trong lượt audit này.

| Màn hình/nhóm | Request đổi trang (ước lượng từ code) | Tải trang trước | Render trước |
|---|---:|---|---|
| 16 màn `ResourceListPage` | 1 | NOT MEASURED | NOT MEASURED |
| Products / terminals | 1 | NOT MEASURED | NOT MEASURED |
| Documents | 1 (lọc phụ không đổi request) | NOT MEASURED | NOT MEASURED |
| Settlements / driver pay policies / payslips | 0 (page đổi chỉ cắt mảng đã tải) | NOT MEASURED | NOT MEASURED |
| Payroll reconciliation | 1 | NOT MEASURED | NOT MEASURED |
| Terminal containers | 0 (page đổi chỉ cắt mảng đã tải) | NOT MEASURED | NOT MEASURED |
| AI run history | 0 hiện tại; request ban đầu không có page | NOT MEASURED | NOT MEASURED |
| Fleet health / profitability / optimization candidates | 0 (page đổi chỉ cắt response đã tải) | NOT MEASURED | NOT MEASURED |

## Kế hoạch sửa sau audit

1. Tạo hằng số page size/options và hook `usePaginatedTable` bọc `useTable`, cấu hình server mode, URL sync, keep-previous, stale time, prefetch next và pagination AntD tiếng Việt.
2. Chuyển shared `ResourceListPage`, products, terminals và documents sang hook chung; sửa Documents để filter/search được gửi tới server theo filter fields thực backend hỗ trợ.
3. Sửa list endpoint đã có paging (AI runs, payroll reconciliation); xử lý page convention riêng cho endpoint 0-based.
4. Chuẩn hóa EntityPicker max 50, `useSelect` server search/debounce; bỏ pageSize 100 ở TerminalSelect và settlement driver picker.
5. Đánh dấu rõ endpoint thiếu pagination và không giả vờ đã server-paginate: settlements, policies, payslips, profitability, fleet health, terminal containers và những response AI/candidate chưa có contract phù hợp cần backend hỗ trợ.
6. Giữ nested aggregate table không phân trang nếu có giới hạn nghiệp vụ rõ; nếu không có, đo kích thước thực và yêu cầu backend giới hạn/paging.

## Kết quả sau triển khai

### Đã chuẩn hóa ở frontend

- Tạo `src/constants/pagination.ts`: mặc định 20, các lựa chọn 10/20/50/100, và cấu hình `showTotal` tiếng Việt theo mẫu `1–20 / 345 mục`. Provider hiện tại tiếp tục giới hạn page size ở 100.
- Tạo `src/hooks/usePaginatedTable.ts`: cấu hình server pagination, URL sync, `keepPreviousData`, stale time 30 giây và prefetch trang kế tiếp. `ResourceListPage` (16 resource list), Products, Terminals, Documents và Load Documents Panel dùng cấu hình chung.
- Payroll reconciliation và AI run history giữ quy ước page 0-based riêng của API, nay có page size mặc định 20, giữ dữ liệu cũ, cache/prefetch và URL state. Không thay đổi quy ước backend.
- Products search debounce 350 ms; Documents search debounce 350 ms và gửi category/status qua filter server hỗ trợ; sort/search trên từng trang Documents vẫn là client-side vì API chưa nhận các tham số này.
- `EntityPicker` giới hạn page size tối đa 50, có debounce search server 300 ms; TerminalSelect và bộ lọc settlement không còn tải 100 tài xế để lọc trong browser.
- Settlements, Driver Pay Policies, payslips, profitability và Terminal Containers đặt mặc định 20, dùng options chung, giữ dữ liệu khi refetch và đồng bộ page/pageSize cùng filter/search phù hợp lên URL. Các endpoint trả mảng vẫn chưa trở thành server pagination; xem bảng backend cần hỗ trợ bên dưới.
- Các bảng profitability, optimization, AI dispatch history và Documents được memo hóa columns; page/table dùng `isFetching` để spinner nằm tại vùng dữ liệu. Những bảng aggregate/detail không có pager không bị đổi cấu trúc.

### Còn phụ thuộc backend

| Màn hình/API | Trạng thái | Hỗ trợ cần bổ sung |
|---|---|---|
| Settlements, driver pay policies, payslips | Vẫn nhận toàn bộ list rồi phân trang/lọc ở client; thao tác đổi trang không gọi request mới | Page/size/total và filter/search server-side trên các endpoint list hiện có. |
| Profitability by load, Fleet Health/coverage | Response report là array đầy đủ; pagination vẫn ở client | Paging/filter server-side hoặc xác nhận giới hạn response cứng. |
| Containers theo terminal | `/api/containers?currentTerminalId=…` chưa có page/size/total được xác minh; UI còn phân trang mảng phía client | Xác nhận controller/hợp đồng endpoint, thêm server pagination và total. |
| Documents | Type/status gửi server; tìm kiếm và một số kiểu sort áp dụng trên trang đang tải | Search server-side và sort theo ngày/kích thước nếu cần kết quả toàn tập chính xác. |
| Optimization candidates và AI dispatch plan history | Phân trang là trên kết quả một lần chạy; giới hạn số ứng viên chưa xác minh | Xác nhận giới hạn kết quả; chỉ thêm endpoint paging nếu nghiệp vụ cần duyệt toàn bộ kết quả. |
| Các bảng detail đang `pagination={false}` | Giữ nguyên vì cần biết kích thước aggregate thực tế | Đo giới hạn dòng hoặc cung cấp API paging cho tập có thể lớn. |

### Đo đạc và giới hạn xác minh

Không có session trình duyệt/dev server và React DevTools Profiler trong lượt này, nên thời gian mạng thực tế và số lần render trước/sau vẫn `NOT MEASURED`. Không ghi số đo giả định thành kết quả thực nghiệm.

Ước lượng tĩnh sau thay đổi: các list dùng shared hook gửi request cho trang hiện tại, sau đó prefetch tối đa một trang kế tiếp; khi bấm sang trang đã prefetch và cache còn fresh, dự kiến không phát sinh request mới tại thời điểm bấm. Nếu prefetch chưa hoàn tất/hết hạn thì query trang đích phát sinh một request. Với các endpoint còn trả toàn bộ array, bấm trang vẫn không phát sinh request vì dữ liệu đã tải toàn bộ từ trước; đây là giới hạn backend còn lại, không được tính là server pagination.

Xác minh cuối phiên: `npm run build` thoát 0; `npm run lint` thoát 0 với 4 cảnh báo dependency hook ở `ResourceListToolbar.tsx` và `useLocalizedColumns.tsx`. Không chạy test theo phạm vi phiên. Không có file test nào được chỉnh sửa.

