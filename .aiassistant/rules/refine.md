---
apply: always
---

# LogisticsX Frontend Engineering Rules

## React, TypeScript, Refine, Ant Design và i18n

**Phạm vi áp dụng:**

* Admin Portal
* TMS Portal
* Customer Portal
* Các package frontend dùng chung
* Mọi code do lập trình viên hoặc AI tạo ra

---

# 1. Quy trình bắt buộc khi viết code

Mỗi lần tạo mới hoặc chỉnh sửa code, câu trả lời hoặc Pull Request phải có hai phần:

1. Checklist trước khi code
2. Checklist sau khi code

Không được gửi code mà thiếu một trong hai checklist.

## 1.1 Mẫu checklist trước khi code

```md
## Checklist trước khi code

- [x] Đã xác định portal: TMS Portal
- [x] Đã xác định feature: Load Management
- [x] Đã xác định resource: loads
- [x] Đã xác định tenantId được lấy từ Tenant Context
- [x] Đã xác định quyền cần kiểm tra: loads.read
- [x] Đã xác định hook lấy dữ liệu: useList
- [x] Đã xác định không cần useEffect
- [x] Đã chuẩn bị locale keys cho title, button và message
- [x] Đã xác định loading, error và empty state
- [x] Đã xác định validation của Ant Design Form
```

Nếu có thông tin chưa chắc chắn, phải ghi rõ:

```md
- [ ] Chưa xác định API response chính xác, đang giả định LoadDto
- [ ] Chưa xác định permission backend, tạm dùng loads.read
```

Không được âm thầm tự suy đoán mà không ghi chú.

---

## 1.2 Mẫu checklist sau khi code

```md
## Checklist sau khi code

- [x] Không hardcode text hiển thị
- [x] Title đã được khai báo trong locales
- [x] Query key có tenantId
- [x] Không gọi API trực tiếp trong useEffect
- [x] Hook có kiểu dữ liệu TypeScript rõ ràng
- [x] useEffect có cleanup đầy đủ
- [x] Không tắt eslint exhaustive-deps
- [x] Đã xử lý loading state
- [x] Đã xử lý error state
- [x] Đã xử lý empty state
- [x] Đã kiểm tra permission
- [x] Đã thêm comment giải thích logic
- [x] Không có any không cần thiết
- [x] Không có console.log
- [x] Code có thể chạy trong React StrictMode
```

Nếu chưa kiểm tra được, không được đánh dấu hoàn thành:

```md
- [ ] Chưa chạy npm run lint
- [ ] Chưa chạy npm run typecheck
- [ ] Chưa kiểm tra responsive trên mobile
```

---

# 2. Cấu trúc bắt buộc của câu trả lời có code

Mỗi lần cung cấp code phải theo thứ tự:

```text
1. Mục tiêu thay đổi
2. Checklist trước khi code
3. Các file cần tạo hoặc chỉnh sửa
4. Code hoàn chỉnh
5. Giải thích các hook và quyết định kỹ thuật
6. Locale keys cần thêm
7. Checklist sau khi code
```

Không chỉ đưa một đoạn code rời nếu thay đổi liên quan nhiều file.

Nếu một component cần service, type, locale và custom hook thì phải chỉ rõ tất cả file liên quan.

---

# 3. Quy định comment bắt buộc

## 3.1 Mỗi file phải có comment mô tả trách nhiệm

Mỗi file mới phải có comment ở đầu file:

```tsx
/**
 * LoadListPage
 *
 * Hiển thị danh sách load trong phạm vi tenant hiện tại.
 * Dữ liệu được quản lý bằng Refine useTable.
 * Component không trực tiếp gọi HTTP client.
 */
```

Đối với service:

```ts
/**
 * Cung cấp các thao tác API liên quan đến Load.
 *
 * Tenant ID được truyền thông qua request context hoặc header.
 */
```

Đối với custom hook:

```ts
/**
 * Quản lý subscription vị trí real-time của một load.
 *
 * Hook tự động hủy subscription khi loadId, tenantId thay đổi
 * hoặc khi component bị unmount.
 */
```

---

## 3.2 Mỗi hook phải có comment giải thích mục đích

Không cần comment lặp lại tên hook, nhưng phải giải thích lý do sử dụng.

Không nên:

```tsx
// State loading
const [loading, setLoading] = useState(false);
```

Nên:

```tsx
// Lưu trạng thái submit cục bộ vì thao tác này không được quản lý
// bởi mutation hook của Refine.
const [isSubmitting, setIsSubmitting] = useState(false);
```

Ví dụ với `useMemo`:

```tsx
// Chỉ tính lại tổng doanh thu khi danh sách load thay đổi.
// Việc memo hóa giúp tránh lặp lại phép tính trên bảng dữ liệu lớn.
const totalRevenue = useMemo(
  () => loads.reduce((total, load) => total + load.deliveryCost, 0),
  [loads],
);
```

Ví dụ với `useEffect`:

```tsx
// Đồng bộ subscription SignalR với load hiện tại.
// Cleanup bắt buộc để tránh đăng ký trùng khi loadId thay đổi.
useEffect(() => {
  // ...
}, [tenantId, loadId]);
```

---

## 3.3 Comment phải giải thích “tại sao”

Comment tốt phải giải thích:

* Tại sao chọn hook này.
* Tại sao dependency này cần thiết.
* Tại sao phải cleanup.
* Tại sao phải memo hóa.
* Tại sao cần xử lý riêng cho tenant.
* Tại sao cần invalidate query.
* Tại sao có ngoại lệ.

Không viết comment chỉ mô tả lại code.

Không nên:

```tsx
// Gán name
form.setFieldValue("name", load.name);
```

Nên:

```tsx
// Ant Design initialValues không cập nhật sau khi API hoàn tất,
// vì vậy cần đồng bộ dữ liệu edit vào Form thủ công.
form.setFieldsValue({
  name: load.name,
});
```

---

## 3.4 Comment cho business rule

Các điều kiện nghiệp vụ phải có comment dẫn giải.

```tsx
// Chỉ cho phép tài xế xác nhận pickup khi load đã được dispatch
// và tài xế đang ở gần địa điểm pickup.
const canConfirmPickup =
  load.status === LoadStatus.Dispatched &&
  load.isInProximity;
```

Không đặt business rule phức tạp trực tiếp trong JSX.

Không nên:

```tsx
{load.status === "Dispatched" &&
  load.isInProximity &&
  permissions.includes("loads.pickup") && (
    <Button>Confirm</Button>
  )}
```

Nên:

```tsx
// Kết hợp trạng thái nghiệp vụ và quyền người dùng để quyết định
// khả năng xác nhận pickup.
const canConfirmPickup =
  load.status === LoadStatus.Dispatched &&
  load.isInProximity &&
  canAccessPickup;
```

---

## 3.5 Không lạm dụng comment

Không comment những câu lệnh quá rõ ràng:

```tsx
// Tăng count lên 1
setCount((current) => current + 1);
```

Mục tiêu là mọi đoạn logic quan trọng đều được giải thích, không phải comment từng ký tự hoặc từng dòng đơn giản.

---

# 4. Quy tắc chung cho React Hooks

## 4.1 Tuân thủ Rules of Hooks

Hook chỉ được gọi:

* Trong React component.
* Trong custom hook.
* Ở cấp cao nhất của component hoặc hook.

Cấm gọi hook trong:

* `if`
* `switch`
* `for`
* `while`
* Callback thông thường
* Event handler
* Hàm utility không phải custom hook

Không được:

```tsx
if (loadId) {
  const result = useOne({
    resource: "loads",
    id: loadId,
  });
}
```

Phải dùng:

```tsx
// Hook luôn được gọi theo cùng thứ tự.
// Query chỉ được kích hoạt khi loadId tồn tại.
const loadQuery = useOne<LoadDto>({
  resource: "loads",
  id: loadId ?? "",
  queryOptions: {
    enabled: Boolean(loadId),
  },
});
```

---

## 4.2 Custom hook phải bắt đầu bằng `use`

Đúng:

```text
useLoadDetails
useLoadTracking
useTenantContext
useCurrentPermissions
useInvoicePayment
```

Sai:

```text
loadHook
getLoadData
trackingLogic
tenantManager
```

---

## 4.3 Một hook chỉ nên có một trách nhiệm chính

Không tạo custom hook quản lý đồng thời:

* Query Load
* SignalR
* Modal
* Form
* Navigation
* Notification

Không nên:

```tsx
useLoadPageEverything();
```

Nên tách:

```tsx
useLoadDetails();
useLoadTracking();
useLoadPermissions();
useLoadActions();
```

---

# 5. Quy định `useState`

## 5.1 Chỉ lưu state cần thiết

Chỉ dùng `useState` cho dữ liệu thay đổi và ảnh hưởng đến UI.

Được phép:

* Modal đang mở hay đóng.
* Tab đang được chọn.
* Dòng đang được chọn.
* Giá trị filter cục bộ chưa submit.
* Trạng thái UI không có trong server state.

Không lưu state có thể tính từ props hoặc query data.

Không được:

```tsx
const [loads, setLoads] = useState<LoadDto[]>([]);
const [activeLoads, setActiveLoads] = useState<LoadDto[]>([]);

useEffect(() => {
  setActiveLoads(
    loads.filter((load) => load.status === "Dispatched"),
  );
}, [loads]);
```

Phải dùng:

```tsx
// Active loads là derived state nên được tính từ dữ liệu gốc,
// không lưu thành một state thứ hai.
const activeLoads = useMemo(
  () =>
    loads.filter(
      (load) => load.status === LoadStatus.Dispatched,
    ),
  [loads],
);
```

---

## 5.2 Không lưu server state bằng `useState`

Không dùng `useState` để giữ dữ liệu lấy từ API nếu Refine hoặc TanStack Query có thể quản lý.

Không nên:

```tsx
const [loads, setLoads] = useState<LoadDto[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

Phải dùng query hook:

```tsx
// Refine quản lý cache, loading, error và refetch,
// tránh tự xây dựng lại server-state lifecycle.
const { result, query } = useList<LoadDto>({
  resource: "loads",
});
```

---

## 5.3 Dùng functional update khi state mới phụ thuộc state cũ

```tsx
// Functional update tránh sử dụng giá trị state cũ từ closure.
setSelectedIds((currentIds) => [
  ...currentIds,
  newId,
]);
```

---

## 5.4 Không gom state không liên quan

Không nên:

```tsx
const [state, setState] = useState({
  modalOpen: false,
  search: "",
  selectedTab: "loads",
  mapZoom: 10,
});
```

Nên tách theo trách nhiệm hoặc dùng `useReducer` nếu chúng thuộc cùng một state machine.

---

# 6. Quy định `useEffect`

## 6.1 Chỉ dùng để đồng bộ hệ thống bên ngoài

`useEffect` chỉ dùng khi component cần đồng bộ với:

* SignalR
* Mapbox
* Browser API
* DOM API
* Timer
* Event listener
* Local storage
* SDK bên thứ ba
* Ant Design Form với dữ liệu async
* Request thủ công không được query library quản lý

Không dùng `useEffect` để:

* Tính derived state.
* Filter hoặc sort dữ liệu.
* Xử lý click.
* Submit form.
* Hiển thị message sau mutation.
* Chuyển trang sau thao tác người dùng.
* Gọi CRUD API thông thường.
* Kiểm tra permission trong mỗi page.
* Sao chép props vào state.

---

## 6.2 Mỗi Effect phải có comment

```tsx
// Đồng bộ tiêu đề tab trình duyệt với tên trang đã dịch.
// Effect chạy lại khi locale hoặc title thay đổi.
useEffect(() => {
  document.title = translatedTitle;
}, [translatedTitle]);
```

---

## 6.3 Mỗi Effect phải xác định cleanup

Nếu Effect đăng ký tài nguyên, cleanup là bắt buộc.

```tsx
// Đăng ký sự kiện online/offline của trình duyệt.
// Cleanup tránh giữ listener sau khi component unmount.
useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);
```

---

## 6.4 Không tắt `exhaustive-deps`

Cấm mặc định:

```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
```

Nếu thật sự bắt buộc, phải có:

* Comment giải thích chi tiết.
* Lý do tại sao không thể tái cấu trúc.
* Reviewer phê duyệt.
* Test chứng minh không tạo stale closure.

---

## 6.5 Không dùng async trực tiếp cho Effect callback

Không được:

```tsx
useEffect(async () => {
  await loadData();
}, []);
```

Phải dùng:

```tsx
// Effect callback không được async vì React cần callback trả về
// cleanup function hoặc undefined.
useEffect(() => {
  const controller = new AbortController();

  const loadPublicTracking = async () => {
    try {
      await trackingService.getTracking({
        token,
        signal: controller.signal,
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        reportError(error);
      }
    }
  };

  void loadPublicTracking();

  return () => {
    controller.abort();
  };
}, [token]);
```

---

## 6.6 Effect phải hoạt động đúng trong StrictMode

Không tắt StrictMode để tránh Effect chạy lại trong development.

Effect phải an toàn trong chu kỳ:

```text
setup → cleanup → setup
```

Không đặt các mutation sau trong mount Effect:

* Tạo Load.
* Tạo Invoice.
* Dispatch Trip.
* Assign Truck.
* Approve Payroll.
* Gửi email.
* Gửi payment.
* Xóa dữ liệu.

---

# 7. Quy định `useMemo`

## 7.1 Chỉ dùng khi có lợi ích rõ ràng

Dùng `useMemo` khi:

* Phép tính tương đối nặng.
* Danh sách dữ liệu lớn.
* Cần reference ổn định cho dependency.
* Giá trị được truyền xuống component đã memo hóa.
* Cần tạo object filter ổn định cho query.

Không dùng cho phép tính đơn giản:

```tsx
const fullName = `${firstName} ${lastName}`;
```

Không cần:

```tsx
const fullName = useMemo(
  () => `${firstName} ${lastName}`,
  [firstName, lastName],
);
```

---

## 7.2 Phải comment lý do memo hóa

```tsx
// Bảng có thể chứa hàng nghìn load, do đó tổng doanh thu
// chỉ được tính lại khi dữ liệu load thay đổi.
const totalRevenue = useMemo(
  () =>
    loads.reduce(
      (total, load) => total + load.deliveryCost,
      0,
    ),
  [loads],
);
```

---

## 7.3 Không dùng `useMemo` để sửa lỗi logic

Nếu component render quá nhiều, phải xác định nguyên nhân trước.

Không tự động thêm `useMemo` vào mọi giá trị.

---

# 8. Quy định `useCallback`

## 8.1 Chỉ dùng khi callback cần reference ổn định

Dùng khi:

* Callback là dependency của Effect.
* Callback truyền vào component có `React.memo`.
* Callback đăng ký vào SignalR hoặc browser listener.
* Custom hook yêu cầu callback ổn định.

Không cần dùng cho mọi handler.

Không cần thiết:

```tsx
const handleClose = useCallback(() => {
  setOpen(false);
}, []);
```

Nếu callback chỉ dùng trong cùng component và không là dependency:

```tsx
const handleClose = () => {
  setOpen(false);
};
```

---

## 8.2 Callback phải có dependency đầy đủ

```tsx
// Callback cần ổn định vì được dùng trong subscription SignalR.
// tenantId được khai báo để tránh gửi event vào tenant cũ.
const handleLocationChanged = useCallback(
  (location: TruckLocationDto) => {
    if (location.tenantId !== tenantId) {
      return;
    }

    updateLocation(location);
  },
  [tenantId, updateLocation],
);
```

---

# 9. Quy định `useRef`

Dùng `useRef` cho:

* DOM element.
* Mapbox instance.
* Marker instance.
* SignalR connection reference.
* Timer ID.
* Giá trị mutable không cần render lại.
* Lưu callback reference khi có lý do rõ ràng.

Không dùng `useRef` để né dependency của `useEffect`.

Không nên:

```tsx
const tenantIdRef = useRef(tenantId);
```

chỉ để bỏ `tenantId` khỏi dependency.

---

## 9.1 Ref phải có kiểu dữ liệu rõ ràng

```tsx
// Giữ instance Mapbox giữa các lần render mà không kích hoạt render lại.
const mapRef = useRef<mapboxgl.Map | null>(null);
```

Không dùng:

```tsx
const mapRef = useRef<any>(null);
```

---

# 10. Quy định `useReducer`

Dùng `useReducer` khi:

* Có nhiều state liên quan chặt chẽ.
* State có nhiều transition.
* Logic giống state machine.
* Nhiều event thay đổi cùng một nhóm state.
* Form wizard có nhiều bước phức tạp.

Ví dụ phù hợp:

* AI dispatch session.
* Multi-step create tenant.
* Load import từ PDF.
* Payment workflow.
* Trip planning workflow.

```tsx
/**
 * Quản lý state của quy trình tạo trip nhiều bước.
 * Reducer giúp các transition được định nghĩa rõ ràng và kiểm thử độc lập.
 */
const [state, dispatch] = useReducer(
  tripCreationReducer,
  initialTripCreationState,
);
```

Không dùng `useReducer` cho một boolean đơn giản.

---

# 11. Quy định `useContext`

Context chỉ dùng cho dữ liệu toàn cục hoặc gần toàn cục:

* Current user.
* Current tenant.
* Theme.
* Locale.
* Feature flags.
* Permission context.
* SignalR connection provider.

Không dùng Context cho dữ liệu API của một page nếu query hook đã đáp ứng được.

Context value phải được memo hóa nếu chứa object:

```tsx
// Ổn định Context value để consumer không render lại
// khi Provider render nhưng dữ liệu thực tế không thay đổi.
const tenantContextValue = useMemo(
  () => ({
    tenantId,
    tenant,
    switchTenant,
  }),
  [tenantId, tenant, switchTenant],
);
```

---

# 12. Quy định `useLayoutEffect`

Chỉ dùng `useLayoutEffect` khi cần:

* Đo kích thước DOM trước khi trình duyệt paint.
* Cập nhật vị trí tooltip hoặc overlay.
* Tránh giao diện nhấp nháy khi tính layout.

Mặc định phải dùng `useEffect`.

Mọi trường hợp dùng `useLayoutEffect` phải có comment giải thích tại sao `useEffect` không đủ.

---

# 13. Quy định `useTransition` và `useDeferredValue`

## 13.1 `useTransition`

Dùng cho cập nhật UI không khẩn cấp:

* Chuyển tab có bảng lớn.
* Filter danh sách lớn.
* Render dashboard phức tạp.
* Chuyển chế độ bản đồ.

Không dùng để thay thế loading của API mutation.

```tsx
// Đánh dấu việc cập nhật filter là không khẩn cấp,
// giúp input tìm kiếm tiếp tục phản hồi mượt.
const [isPending, startTransition] = useTransition();

const handleSearchChange = (value: string) => {
  startTransition(() => {
    setSearchKeyword(value);
  });
};
```

---

## 13.2 `useDeferredValue`

Dùng khi cần trì hoãn giá trị render nặng:

```tsx
// Trì hoãn keyword dùng để lọc bảng lớn,
// trong khi input vẫn cập nhật ngay lập tức.
const deferredKeyword = useDeferredValue(searchKeyword);
```

Không dùng để debounce API.

Đối với API search phải dùng debounce hook hoặc query configuration riêng.

---

# 14. Quy định custom hooks

## 14.1 Khi nào phải tạo custom hook

Phải tách custom hook nếu:

* Component có Effect dài trên 15 dòng.
* Có từ hai Effect phục vụ cùng một chức năng.
* Logic được dùng ở hai nơi trở lên.
* Có subscription và cleanup.
* Có logic query kết hợp permission.
* Có logic map hoặc SignalR.
* Có nhiều state liên quan một workflow.
* Component vượt quá khoảng 250 dòng.

---

## 14.2 Custom hook không trả về JSX

Không nên:

```tsx
const useLoadModal = () => {
  return <Modal />;
};
```

Custom hook trả về state và action:

```tsx
const {
  isOpen,
  selectedLoad,
  openModal,
  closeModal,
} = useLoadDetailsModal();
```

Component chịu trách nhiệm render JSX.

---

## 14.3 Custom hook phải có type return

```tsx
interface UseLoadTrackingResult {
  location: TruckLocationDto | null;
  connectionStatus: ConnectionStatus;
  reconnect: () => Promise<void>;
}

/**
 * Theo dõi vị trí real-time của load trong tenant hiện tại.
 */
export const useLoadTracking = (
  params: UseLoadTrackingParams,
): UseLoadTrackingResult => {
  // ...
};
```

---

## 14.4 Custom hook phải xử lý tenant

Hook truy cập dữ liệu tenant phải:

* Nhận `tenantId` rõ ràng; hoặc
* Lấy từ `useTenantContext`.
* Không dùng tenant mặc định ẩn.
* Không giữ dữ liệu tenant cũ khi tenant thay đổi.
* Dừng query khi chưa có tenant.
* Cleanup subscription tenant cũ.

---

# 15. Quy định Refine và TanStack Query Hooks

## 15.1 Ưu tiên hook của Refine

CRUD thông thường phải ưu tiên:

* `useList`
* `useOne`
* `useMany`
* `useTable`
* `useShow`
* `useCreate`
* `useUpdate`
* `useDelete`
* `useCustom`
* `useCustomMutation`

Không gọi `axios` hoặc `fetch` trực tiếp trong page component.

---

## 15.2 Query phụ thuộc phải dùng `enabled`

```tsx
// Chỉ tải load sau khi tenant và loadId đã sẵn sàng,
// tránh request không hợp lệ khi route mới khởi tạo.
const loadQuery = useOne<LoadDto>({
  resource: "loads",
  id: loadId ?? "",
  queryOptions: {
    enabled: Boolean(tenantId && loadId),
  },
});
```

---

## 15.3 Query key phải chứa tenantId

Custom query:

```tsx
const loadQuery = useQuery({
  queryKey: [
    "loads",
    tenantId,
    loadId,
  ],
  queryFn: ({ signal }) =>
    loadService.getById({
      tenantId,
      loadId,
      signal,
    }),
  enabled: Boolean(tenantId && loadId),
});
```

Cấm:

```tsx
queryKey: ["loads", loadId];
```

---

## 15.4 Mutation phải invalidate đúng resource

```tsx
// Sau khi cập nhật load, invalidate cả chi tiết và danh sách
// để các màn hình cùng hiển thị dữ liệu mới nhất.
await queryClient.invalidateQueries({
  queryKey: ["loads", tenantId],
});
```

Không gọi `window.location.reload()` để cập nhật dữ liệu.

---

## 15.5 Phải xử lý đủ trạng thái query

Mọi page dữ liệu phải có:

* Loading state.
* Error state.
* Empty state.
* Success state.

```tsx
if (query.isLoading) {
  return <LoadListSkeleton />;
}

if (query.isError) {
  return <QueryErrorState onRetry={query.refetch} />;
}

if (!loads.length) {
  return <Empty description={t("loads.empty.title")} />;
}
```

---

# 16. Quy định Ant Design Hooks

## 16.1 `Form.useForm`

Mỗi Form phức tạp phải sử dụng:

```tsx
const [form] = Form.useForm<LoadFormValues>();
```

Không dùng Form không có generic type.

---

## 16.2 Không dùng cả Form và useState cho cùng một field

Form là nguồn dữ liệu duy nhất cho field.

Không được:

```tsx
const [name, setName] = useState("");

<Form.Item name="name">
  <Input
    value={name}
    onChange={(event) => setName(event.target.value)}
  />
</Form.Item>
```

---

## 16.3 `Form.useWatch` chỉ theo dõi field cần thiết

```tsx
// Theo dõi isHazmat để hiển thị các trường Hazmat liên quan.
// Không theo dõi toàn bộ Form để tránh render không cần thiết.
const isHazmat = Form.useWatch("isHazmat", form);
```

Không nên:

```tsx
const allValues = Form.useWatch([], form);
```

trừ khi có lý do và comment rõ ràng.

---

## 16.4 Dữ liệu edit bất đồng bộ

```tsx
// initialValues chỉ áp dụng khi Form mount.
// Khi query hoàn tất, cần đồng bộ dữ liệu load vào Form.
useEffect(() => {
  if (!load) {
    return;
  }

  form.setFieldsValue({
    number: load.number,
    name: load.name,
    status: load.status,
  });
}, [form, load]);
```

---

## 16.5 `App.useApp`

Message, notification và modal phải lấy từ:

```tsx
const { message, notification, modal } = App.useApp();
```

Không dùng API static nếu ứng dụng cần nhận locale, theme hoặc context.

---

# 17. Quy định Router Hooks

Các hook router như:

* `useNavigate`
* `useParams`
* `useSearchParams`
* Refine navigation hooks

chỉ dùng trong component hoặc custom navigation hook.

Route parameter phải được validate trước khi dùng.

```tsx
// Route có thể chứa ID không hợp lệ nên cần kiểm tra
// trước khi kích hoạt query.
const { loadId } = useParams<{
  loadId: string;
}>();

const hasValidLoadId =
  typeof loadId === "string" &&
  loadId.length > 0;
```

Không điều hướng bằng Effect sau hành động người dùng nếu có thể điều hướng ngay trong handler.

---

# 18. Quy định Auth và Permission Hooks

Không kiểm tra quyền bằng string rải rác trong JSX.

Không nên:

```tsx
permissions.includes("loads.update");
```

Phải dùng hook hoặc component chuẩn:

```tsx
// Quyền được lấy từ access-control provider,
// tránh mỗi component tự diễn giải permission.
const { data: canUpdateLoad } = useCan({
  resource: "loads",
  action: "update",
});
```

Hoặc:

```tsx
<CanAccess
  resource="loads"
  action="update"
  fallback={null}
>
  <EditLoadButton />
</CanAccess>
```

Frontend permission chỉ phục vụ UI. Backend vẫn phải xác thực quyền.

---

# 19. Quy định SignalR Hooks

SignalR phải được đóng gói trong:

* Provider.
* Service.
* Custom hook.

Không tạo connection trực tiếp trong mỗi page.

Hook chuẩn đề xuất:

```text
useTrackingHub
useMessagingHub
useNotificationHub
useTripTracking
useUnreadMessages
```

Mỗi subscription phải có cleanup.

```tsx
// Subscription phụ thuộc tenantId và loadId.
// Cleanup tránh nhận event từ load hoặc tenant cũ.
useEffect(() => {
  if (!tenantId || !loadId) {
    return;
  }

  const unsubscribe = trackingHub.subscribeToLoad({
    tenantId,
    loadId,
    onLocationChanged: handleLocationChanged,
  });

  return () => {
    unsubscribe();
  };
}, [
  tenantId,
  loadId,
  handleLocationChanged,
]);
```

Event nhận được phải kiểm tra:

* Tenant ID.
* Resource ID.
* Event ID nếu có.
* Timestamp hoặc version nếu có.
* Permission hiển thị dữ liệu.

---

# 20. Quy định i18n và locales

## 20.1 Cấm hardcode text hiển thị

Mọi text người dùng nhìn thấy phải nằm trong locales:

* Page title.
* Card title.
* Modal title.
* Table column title.
* Button text.
* Form label.
* Placeholder.
* Validation message.
* Success message.
* Error message.
* Empty state.
* Tooltip.
* Menu item.
* Breadcrumb.
* Status label.
* Confirm message.
* Notification content.

Cấm:

```tsx
<PageHeader title="Load Management" />
```

Phải dùng:

```tsx
const { t } = useTranslation("loads");

<PageHeader title={t("list.title")} />
```

---

## 20.2 Title bắt buộc dùng locale key

Tất cả thuộc tính `title` phải dùng `t()`:

```tsx
<Card title={t("details.cards.route.title")}>
```

```tsx
<Modal title={t("deleteModal.title")}>
```

```tsx
<Table.Column
  title={t("table.columns.status")}
  dataIndex="status"
/>
```

Không sử dụng:

```tsx
title="Status"
```

---

## 20.3 Cấu trúc locale theo feature

```text
src/
  locales/
    en/
      common.json
      loads.json
      trips.json
      trucks.json
      invoices.json
    vi/
      common.json
      loads.json
      trips.json
      trucks.json
      invoices.json
```

---

## 20.4 Locale key phải có cấu trúc rõ ràng

Ví dụ `locales/en/loads.json`:

```json
{
  "list": {
    "title": "Loads",
    "description": "Manage shipment loads"
  },
  "table": {
    "columns": {
      "number": "Load number",
      "status": "Status",
      "customer": "Customer",
      "deliveryCost": "Delivery cost"
    }
  },
  "actions": {
    "create": "Create load",
    "edit": "Edit load",
    "delete": "Delete load",
    "dispatch": "Dispatch load"
  },
  "messages": {
    "createSuccess": "Load created successfully",
    "updateSuccess": "Load updated successfully",
    "deleteSuccess": "Load deleted successfully"
  },
  "validation": {
    "numberRequired": "Load number is required"
  }
}
```

Ví dụ `locales/vi/loads.json`:

```json
{
  "list": {
    "title": "Quản lý lô hàng",
    "description": "Quản lý các lô hàng vận chuyển"
  },
  "table": {
    "columns": {
      "number": "Mã lô hàng",
      "status": "Trạng thái",
      "customer": "Khách hàng",
      "deliveryCost": "Chi phí giao hàng"
    }
  },
  "actions": {
    "create": "Tạo lô hàng",
    "edit": "Chỉnh sửa lô hàng",
    "delete": "Xóa lô hàng",
    "dispatch": "Điều phối lô hàng"
  },
  "messages": {
    "createSuccess": "Tạo lô hàng thành công",
    "updateSuccess": "Cập nhật lô hàng thành công",
    "deleteSuccess": "Xóa lô hàng thành công"
  },
  "validation": {
    "numberRequired": "Vui lòng nhập mã lô hàng"
  }
}
```

---

## 20.5 Không tạo locale key quá chung chung

Không nên:

```json
{
  "title": "Title",
  "button": "Button",
  "name": "Name"
}
```

Nên:

```json
{
  "details": {
    "title": "Load details"
  },
  "actions": {
    "create": "Create load"
  },
  "table": {
    "columns": {
      "name": "Load name"
    }
  }
}
```

---

## 20.6 Không ghép câu bằng nhiều key riêng

Không nên:

```tsx
`${t("common.delete")} ${t("loads.name")}`
```

Phải dùng một câu hoàn chỉnh:

```json
{
  "deleteModal": {
    "title": "Delete load",
    "description": "Are you sure you want to delete load {{number}}?"
  }
}
```

```tsx
t("deleteModal.description", {
  number: load.number,
});
```

Điều này giúp mỗi ngôn ngữ có thể thay đổi thứ tự câu.

---

## 20.7 Trạng thái enum phải được dịch

Không hiển thị enum trực tiếp:

```tsx
<Tag>{load.status}</Tag>
```

Phải dùng:

```tsx
<Tag>
  {t(`status.${load.status}`)}
</Tag>
```

Locale:

```json
{
  "status": {
    "Draft": "Draft",
    "Dispatched": "Dispatched",
    "PickedUp": "Picked up",
    "Delivered": "Delivered",
    "Cancelled": "Cancelled"
  }
}
```

---

# 21. Quy định TypeScript

* Không sử dụng `any` trừ trường hợp có comment giải thích.
* DTO, Form Values và View Model phải tách rõ.
* Không dùng non-null assertion `!` nếu chưa validate.
* Enum hoặc union type phải dùng thay string rải rác.
* Props phải có interface hoặc type rõ ràng.
* Custom hook phải khai báo kiểu trả về.
* API error phải được chuẩn hóa.
* Không ép kiểu bằng `as` chỉ để tắt lỗi TypeScript.

Ví dụ:

```tsx
interface LoadListPageProps {
  tenantId: string;
  readonly?: boolean;
}
```

---

# 22. Quy định component

Một component chỉ nên có một trách nhiệm chính.

Nên tách component khi:

* File vượt khoảng 250 dòng.
* JSX lồng quá sâu.
* Có phần UI được dùng lại.
* Có logic business phức tạp.
* Có nhiều modal trong cùng page.
* Có nhiều query không liên quan.
* Component có trên 3–4 Effect.

Cấu trúc đề xuất:

```text
features/
  loads/
    api/
    components/
    hooks/
    locales/
    pages/
    types/
    utils/
```

---

# 23. Quy định không hardcode

Không hardcode:

* Tenant ID.
* Role.
* Permission.
* API URL.
* Route URL nếu đã có route constants.
* Status.
* Feature flag.
* Locale text.
* Date format.
* Currency format.
* Distance unit.
* Timeout quan trọng.
* Pagination size.

Phải lấy từ:

* Config.
* Constants.
* Environment.
* Context.
* Locale.
* Backend response.
* Tenant settings.

---

# 24. Quy định loading, error và empty state

Mọi page phải có đủ:

```text
Loading
Error
Empty
Success
Unauthorized
Forbidden
```

Không hiển thị bảng trống trong lúc loading.

Không nuốt lỗi bằng:

```tsx
catch {
  // Ignore
}
```

Lỗi phải:

* Ghi log qua error service nếu cần.
* Hiển thị message đã dịch.
* Cho phép retry nếu phù hợp.
* Không lộ stack trace cho người dùng.

---

# 25. Quy định accessibility

* Mọi input có label.
* Icon button có `aria-label`.
* Modal có title đã dịch.
* Không dùng màu sắc làm tín hiệu duy nhất.
* Button phải thể hiện trạng thái loading khi submit.
* Form error phải có nội dung rõ ràng.
* Interactive element phải dùng `button`, không dùng `div` click.
* Table action phải có tooltip hoặc accessible label.

```tsx
<Tooltip title={t("actions.edit")}>
  <Button
    type="text"
    icon={<EditOutlined />}
    aria-label={t("actions.edit")}
    onClick={handleEdit}
  />
</Tooltip>
```

---

# 26. Quy định AI khi tạo code cho dự án

Khi AI tạo hoặc chỉnh sửa code, AI phải:

1. Đọc yêu cầu nghiệp vụ liên quan.
2. Xác định portal, tenant, role và permission.
3. Viết checklist trước khi code.
4. Liệt kê các file thay đổi.
5. Viết code hoàn chỉnh, không dùng dấu `...` thay cho phần quan trọng.
6. Thêm comment mô tả file.
7. Thêm comment giải thích hook và logic phức tạp.
8. Không hardcode text giao diện.
9. Viết locale cho ít nhất tiếng Anh và tiếng Việt.
10. Dùng hook phù hợp thay vì lạm dụng `useEffect`.
11. Xử lý loading, error và empty state.
12. Viết checklist sau khi code.
13. Nêu rõ phần chưa thể kiểm chứng.
14. Không tuyên bố code đã chạy nếu chưa thực sự chạy.
15. Không tự ý thay đổi business rule.

---

# 27. Mẫu đầu ra bắt buộc khi AI viết code

```md
# Mục tiêu

Tạo trang danh sách Load cho TMS Portal.

## Checklist trước khi code

- [x] Portal: TMS Portal
- [x] Resource: loads
- [x] Tenant-aware query
- [x] Permission: loads.read
- [x] Hook chính: useTable
- [x] Không cần useEffect
- [x] Có locale tiếng Anh và tiếng Việt

## File thay đổi

1. src/features/loads/pages/LoadListPage.tsx
2. src/locales/en/loads.json
3. src/locales/vi/loads.json

## Code

...

## Giải thích hooks

- useTable: quản lý dữ liệu bảng, pagination và loading.
- useTranslation: lấy toàn bộ text hiển thị từ locales.
- useCan: kiểm tra quyền tạo, sửa và xóa Load.

## Locale keys

...

## Checklist sau khi code

- [x] Không hardcode title
- [x] Không gọi API bằng useEffect
- [x] Query có tenantId
- [x] Có loading/error/empty state
- [x] Có comment giải thích
- [ ] Chưa chạy lint trong môi trường thực tế
```

---

# 28. Pull Request checklist

```md
## Architecture

- [ ] Code nằm đúng feature/module.
- [ ] Component không gọi API client trực tiếp.
- [ ] Business logic không đặt trực tiếp trong JSX.
- [ ] Không vi phạm tenant isolation.
- [ ] Không giữ server state bằng useState.

## Hooks

- [ ] Hook được gọi đúng Rules of Hooks.
- [ ] Không lạm dụng useEffect.
- [ ] Effect có comment giải thích.
- [ ] Effect có dependency đầy đủ.
- [ ] Effect có cleanup nếu đăng ký tài nguyên.
- [ ] useMemo và useCallback có lý do rõ ràng.
- [ ] Không dùng ref để né dependency.
- [ ] Custom hook có type return rõ ràng.

## i18n

- [ ] Không có user-facing text bị hardcode.
- [ ] Mọi title lấy từ locales.
- [ ] Có locale tiếng Anh.
- [ ] Có locale tiếng Việt.
- [ ] Enum/status đã được dịch.
- [ ] Message và validation đã được dịch.
- [ ] Không ghép câu từ nhiều key nhỏ.

## Ant Design

- [ ] Form có generic type.
- [ ] Không quản lý cùng field bằng Form và useState.
- [ ] Modal, message và notification dùng App.useApp.
- [ ] Table có loading và empty state.
- [ ] Button submit có loading.
- [ ] Icon button có aria-label.

## Data

- [ ] Query key có tenantId.
- [ ] Query phụ thuộc dùng enabled.
- [ ] Mutation invalidate đúng query.
- [ ] Có error handling.
- [ ] Có retry hoặc retry button khi phù hợp.
- [ ] Không dùng window.location.reload.

## Code quality

- [ ] File có comment mô tả trách nhiệm.
- [ ] Hook và logic phức tạp có comment.
- [ ] Không có any không cần thiết.
- [ ] Không có console.log.
- [ ] Không có dead code.
- [ ] Không tắt ESLint tùy tiện.
- [ ] Không hardcode API URL.
- [ ] Không hardcode permission hoặc tenant.

## Verification

- [ ] Đã chạy lint.
- [ ] Đã chạy typecheck.
- [ ] Đã chạy test.
- [ ] Đã kiểm tra desktop.
- [ ] Đã kiểm tra mobile.
- [ ] Đã kiểm tra đổi locale.
- [ ] Đã kiểm tra đổi tenant.
- [ ] Đã kiểm tra người dùng không có quyền.
- [ ] Đã kiểm tra loading/error/empty state.
```

---

# 29. ESLint rules đề xuất

```js
export default [
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_"
        }
      ],

      "no-console": [
        "error",
        {
          "allow": ["warn", "error"]
        }
      ],

      "react/jsx-no-useless-fragment": "error",
      "react/jsx-key": "error"
    }
  }
];
```

Có thể bổ sung ESLint custom rule hoặc plugin i18n để phát hiện text hardcode trong JSX.

---

# 30. Nguyên tắc cuối cùng

Trước khi thêm một hook, phải trả lời:

1. Hook này giải quyết vấn đề gì?
2. Dữ liệu là local state hay server state?
3. Giá trị có thể tính trực tiếp không?
4. Có thật sự cần Effect không?
5. Có cần cleanup không?
6. Dependency đã đầy đủ chưa?
7. Có liên quan tenant không?
8. Có liên quan permission không?
9. Text hiển thị đã nằm trong locales chưa?
10. Logic đã có comment giải thích chưa?

Trước khi hoàn thành code, phải xác nhận:

> Không hardcode text, không rò rỉ dữ liệu tenant, không lạm dụng useEffect, hook có dependency đúng, code có comment giải thích và có checklist kiểm tra rõ ràng.
