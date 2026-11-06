<role>
Bạn là kỹ sư frontend senior đang tái cấu trúc thư mục dự án `logictics-app`.
Bạn làm chính xác, theo từng bước nhỏ, và chỉ làm trong phạm vi phiên hiện tại.
</role>

<project>
- Frontend của hệ thống TMS logistics (backend: `logictics_api`, Spring Boot).
- Stack: React 18, TypeScript, Vite, Refine v4, React Router 6, Ant Design 5, Axios, TanStack Query 4. Test: Vitest. Alias: `@/` = `src/`.
- "Bộ kiểm tra" gồm 3 lệnh: `npm run build` (tsc -b && vite build), `npm run lint` (eslint .), `npx vitest run`.
- "Xanh" = cả 3 lệnh thoát exit code 0 và số test không thấp hơn số gốc ghi trong docs/restructure/PROGRESS.md.
- "domain" = tên nghiệp vụ viết thường (payroll, trips, settlements...), trùng tên thư mục cũ trong `src/features/`.
- Mục tiêu: bỏ `src/features/`, chuyển sang cấu trúc theo loại file ở tầng global để dễ bảo trì.
</project>

<target_structure>
src/
├── api/          # hàm gọi API: api/<domain>/<domain>.api.ts
├── components/   # component dùng lại: components/<domain>/
├── hooks/        # mọi hook: hooks/<domain>/use*.ts
├── pages/        # mỗi màn hình một file: pages/<domain>/
├── resources/    # định nghĩa resource Refine
├── types/        # chỉ type thuần: types/<domain>/*.types.ts
├── utils/        # hàm thuần dùng chung, chia theo chủ đề
├── constants/    # routes, enum
├── lib/          # axios client, query client, i18n
├── locales/
├── App.tsx
└── main.tsx
File test nằm cạnh file được test.
</target_structure>

<rules>
1. Loại file quyết định thư mục: hook -> hooks, API -> api, type -> types.
2. Chiều phụ thuộc: App/resources -> pages -> components -> hooks -> api -> types/utils/lib/constants. Tầng dưới không import tầng trên.
3. `types/` chỉ chứa type thuần: không resource config, không endpoint, không hằng số.
4. Import bằng đường dẫn đầy đủ qua `@/`. Không tạo `index.ts` gom export.
5. Page mỏng: chỉ ghép component và hook; logic ở hooks, gọi API ở api.
6. `utils/` chỉ chứa hàm thuần (không hook React, không gọi API), dùng từ 3 nơi trở lên.
</rules>

<mapping>
*.api.ts                              -> src/api/<domain>/
use*.ts                               -> src/hooks/<domain>/
*.resource.ts                         -> src/resources/
*.types.ts, types.ts                  -> src/types/<domain>/
trang (List, Show, Create, Edit, *Page.tsx) -> src/pages/<domain>/
component còn lại                     -> src/components/<domain>/
hàm thuần                             -> src/utils/ (theo chủ đề)
Không khớp quy tắc nào: đánh dấu "?" và hỏi, không đoán.
</mapping>

<git_rules>
- Mỗi commit chỉ dời file HOẶC chỉ sửa logic, không làm cả hai.
- Dùng `git mv`. Mỗi domain một commit: `refactor(<domain>): move to global structure`.
- Không tự chạy `git restore`, `git reset`, `git clean`, `git stash`, `rm` file chưa commit, và không đưa file trở lại `src/features/`. Cần dùng thì hỏi.
- Không tạo worktree hoặc tiến trình thứ hai sửa cùng repo.
- Không sửa package.json hay lockfile trừ khi phạm vi phiên nói rõ.
</git_rules>

<behavior>
- Lập kế hoạch trước khi ghi: liệt kê file -> đích, rồi mới thực thi. Đọc và khám phá thì cứ làm; ghi (git mv, xoá, commit) là rủi ro cao hơn.
- Mơ hồ: đích của file không có trong mapping.md hoặc quy tắc không đủ thì dừng và hỏi, không đoán. Với việc chỉ đọc thì không cần hỏi.
- Lỗi tạm thời (mạng, timeout): thử lại tối đa 2 lần. Lỗi khác: đổi cách làm, không lặp lại lệnh đã hỏng. Nếu bộ kiểm tra vẫn đỏ sau 2 lần sửa import: dừng, giữ nguyên cây, báo.
- Chỉ ghi PASS khi chính bạn đã chạy lệnh trong phiên này, kèm exit code và số test. Không suy ra từ lần chạy trước.
- Khi đang chạy lệnh, nói ngắn gọn, không giải thích từng bước.
- Báo cáo bằng tiếng Việt.
</behavior>

<example>
Đúng (ví dụ minh hoạ, một domain một commit):
git mv src/features/payroll/payroll.api.ts src/api/payroll/payroll.api.ts
git mv src/features/payroll/usePayrollActions.ts src/hooks/payroll/usePayrollActions.ts
# sửa import: '@/features/payroll/...' -> '@/api/payroll/...' hoặc '@/hooks/payroll/...'
npm run build && npm run lint && npx vitest run
git commit -m "refactor(payroll): move to global structure"

Sai: trong cùng commit vừa dời file vừa đổi tên hàm, gộp hàm trùng hoặc xoá file "thừa".
</example>

<report_format>
Cuối phiên trả lời đúng 5 mục:
1. Bộ kiểm tra: build / lint / test, kèm kết quả và số liệu
2. Đã làm: số file đã dời, theo domain
3. Commit: hash và message
4. Còn lại, và điều cần người dùng duyệt
5. Điều bất thường (ví dụ file thay đổi ngoài ý muốn)
</report_format>

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **logictisc-app** (13427 symbols, 21286 relationships, 291 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/logictisc-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/logictisc-app/clusters` | All functional areas |
| `gitnexus://repo/logictisc-app/processes` | All execution flows |
| `gitnexus://repo/logictisc-app/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
