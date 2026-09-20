import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { createLogger, defineConfig, loadEnv } from 'vite'

// Dev/preview only: forwards /api/** to the Spring API so the browser never
// issues a cross-origin request (the backend has no CORS config; see
// frontend-context.md BLOCKER-01). Docker Compose exposes the API at :8080,
// IntelliJ profile "local" at :18080. Override with API_PROXY_TARGET in .env.
function apiProxyTarget(mode: string, cwd: string): string {
  const env = loadEnv(mode, cwd, '')
  return (env.API_PROXY_TARGET || 'http://localhost:8080').replace(/\/+$/, '')
}

function createDevLogger(target: string) {
  const logger = createLogger()
  const originalError = logger.error.bind(logger)
  let warnedBackendOffline = false

  logger.error = (msg, options) => {
    if (
      typeof msg === 'string' &&
      msg.includes('http proxy error') &&
      (msg.includes('ECONNREFUSED') || msg.includes('502'))
    ) {
      if (!warnedBackendOffline) {
        warnedBackendOffline = true
        logger.warn(
          `\n⚠️  [vite] Backend API chưa chạy tại ${target}. Dev proxy đang kích hoạt chế độ Mock Fallback cho /api.\n`,
        )
      }
      return
    }
    originalError(msg, options)
  }

  return logger
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const target = apiProxyTarget(mode, process.cwd())

  return {
    customLogger: createDevLogger(target),
    plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@formatters': fileURLToPath(new URL('./src/formatters', import.meta.url)),
      '@forms': fileURLToPath(new URL('./src/forms', import.meta.url)),
      '@table': fileURLToPath(new URL('./src/table', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@providers': fileURLToPath(new URL('./src/providers', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@test': fileURLToPath(new URL('./src/test', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@locales': fileURLToPath(new URL('./src/locales', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget(mode, process.cwd()),
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (_err, req, res) => {
            // When backend server (e.g. localhost:8080) is not running, provide graceful fallback
            // for development mode so frontend doesn't crash or get stuck at bootstrap health check.
            const url = req.url || '';
            const method = req.method || 'GET';

            if (!res || !('writeHead' in res) || res.headersSent) {
              return;
            }

            if (url === '/api/health' || url.startsWith('/api/health?')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  application: 'logicstic',
                  database: 'enabled',
                  profiles: 'dev-local',
                  status: 'UP',
                }),
              );
              return;
            }

            if (url === '/api/dev-auth/login' && method === 'POST') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  accessToken: 'local-dev-mock-token',
                  tokenType: 'Bearer',
                  expiresIn: 86400,
                  subject: '00000000-0000-0000-0000-000000000001',
                  email: 'admin@logicstic.local',
                  tenantId: 'local-development',
                  roles: ['SUPERADMIN'],
                }),
              );
              return;
            }

            if (url === '/api/me' && method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  code: 'OK',
                  message: 'Success',
                  data: {
                    subject: '00000000-0000-0000-0000-000000000001',
                    email: 'admin@logicstic.local',
                    tenantId: 'local-development',
                    roles: ['SUPERADMIN'],
                    employeeId: '00000000-0000-0000-0000-000000000001',
                  },
                  errors: [],
                  meta: {
                    timestamp: new Date().toISOString(),
                    path: '/api/me',
                    requestId: null,
                  },
                }),
              );
              return;
            }

            function getMockItems(pathname: string): Record<string, unknown>[] {
              if (pathname.startsWith('/api/customers')) {
                return [
                  { id: '11111111-1111-1111-1111-111111111111', name: 'Công ty TNHH Logistics Vina', email: 'contact@logisticsvina.vn', phone: '0901234567', status: 'active', isVatExempt: false },
                  { id: '22222222-2222-2222-2222-222222222222', name: 'Tập đoàn Vận tải Á Châu', email: 'info@achautransport.com', phone: '0912345678', status: 'active', isVatExempt: true },
                  { id: '33333333-3333-3333-3333-333333333333', name: 'Chuỗi cung ứng Toàn Cầu', email: 'support@globalchain.vn', phone: '0987654321', status: 'active', isVatExempt: false },
                ];
              }
              if (pathname.startsWith('/api/drivers')) {
                return [
                  { id: '44444444-4444-4444-4444-444444444444', firstName: 'Nguyễn Văn', lastName: 'An', email: 'an.nguyen@logictics.local', status: 'active' },
                  { id: '55555555-5555-5555-5555-555555555555', firstName: 'Trần Văn', lastName: 'Bình', email: 'binh.tran@logictics.local', status: 'active' },
                ];
              }
              if (pathname.startsWith('/api/trucks')) {
                return [
                  { id: '66666666-6666-6666-6666-666666666666', number: 'TRK-101', licensePlate: '29C-888.99', status: 'available', type: 'tractor', vehicleCapacity: 30000, mainDriverName: 'Nguyễn Văn An' },
                  { id: '77777777-7777-7777-7777-777777777777', number: 'TRK-102', licensePlate: '51D-555.22', status: 'available', type: 'dry_van', vehicleCapacity: 25000, mainDriverName: 'Trần Văn Bình' },
                ];
              }
              if (pathname.startsWith('/api/terminals')) {
                return [
                  { id: '88888888-8888-8888-8888-888888888888', code: 'VNSGN', name: 'Cảng Cát Lái - Sài Gòn', countryCode: 'VN', type: 'SEA_PORT', addressLine1: 'Nguyễn Thị Định', addressCity: 'Thành phố Hồ Chí Minh', addressState: 'TPHCM', addressZipCode: '700000', addressCountry: 'VN' },
                  { id: '99999999-9999-9999-9999-999999999999', code: 'VNHPH', name: 'Cảng Đình Vũ - Hải Phòng', countryCode: 'VN', type: 'SEA_PORT', addressLine1: 'Bán đảo Đình Vũ', addressCity: 'Hải Phòng', addressState: 'HP', addressZipCode: '180000', addressCountry: 'VN' },
                ];
              }
              if (pathname.startsWith('/api/roles')) {
                return [
                  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'SUPERADMIN', displayName: 'Quản trị viên cấp cao' },
                  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'DISPATCHER', displayName: 'Điều phối viên' },
                  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'DRIVER', displayName: 'Tài xế' },
                ];
              }
              if (pathname.startsWith('/api/employees')) {
                return [
                  { id: '00000000-0000-0000-0000-000000000001', firstName: 'Quản trị', lastName: 'Hệ thống', email: 'admin@logicstic.local', status: 'active' },
                  { id: '44444444-4444-4444-4444-444444444444', firstName: 'Nguyễn Văn', lastName: 'An', email: 'an.nguyen@logictics.local', status: 'active' },
                  { id: '55555555-5555-5555-5555-555555555555', firstName: 'Trần Văn', lastName: 'Bình', email: 'binh.tran@logictics.local', status: 'active' },
                ];
              }
              if (pathname.startsWith('/api/loads')) {
                return [
                  { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', number: 1001, name: 'Lô hàng Linh kiện Samsung', status: 'dispatched', customerId: '11111111-1111-1111-1111-111111111111', customerName: 'Công ty TNHH Logistics Vina', assignedTruckNumber: 'TRK-101' },
                  { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', number: 1002, name: 'Lô hàng Dệt may xuất khẩu', status: 'draft', customerId: '22222222-2222-2222-2222-222222222222', customerName: 'Tập đoàn Vận tải Á Châu', assignedTruckNumber: 'TRK-102' },
                ];
              }
              if (pathname.startsWith('/api/trips')) {
                return [
                  { id: '12121212-1212-1212-1212-121212121212', number: 3001, name: 'Chuyến Sài Gòn - Bình Dương', status: 'dispatched', truckNumber: 'TRK-101', totalDistance: 45 },
                  { id: '23232323-2323-2323-2323-232323232323', number: 3002, name: 'Chuyến Hải Phòng - Hà Nội', status: 'draft', truckNumber: 'TRK-102', totalDistance: 120 },
                ];
              }
              if (pathname.startsWith('/api/invoices')) {
                return [
                  { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', number: 5001, type: 'customer', status: 'sent', customerName: 'Công ty TNHH Logistics Vina', employeeName: 'Quản trị Hệ thống', dueDate: '2026-10-15' },
                ];
              }
              return [];
            }

            if (method === 'GET') {
              const idMatch = url.match(/\/api\/[a-z-]+\/([0-9a-f-]{36})/i);
              if (idMatch) {
                const all = getMockItems(url);
                const found = all.find((item) => item.id === idMatch[1]) || all[0] || { id: idMatch[1] };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    success: true,
                    code: 'OK',
                    data: found,
                    errors: [],
                    meta: { timestamp: new Date().toISOString(), path: url, requestId: null },
                  }),
                );
                return;
              }

              const items = getMockItems(url);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  code: 'OK',
                  message: 'Success (dev mock)',
                  data: {
                    items,
                    totalItems: items.length,
                    totalPages: 1,
                    currentPage: 1,
                    pageSize: 20,
                  },
                  errors: [],
                  meta: {
                    timestamp: new Date().toISOString(),
                    path: url,
                    requestId: null,
                  },
                }),
              );
              return;
            }

            if (method === 'POST') {
              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  code: 'CREATED',
                  message: 'Created successfully (dev mock)',
                  data: { id: '00000000-0000-0000-0000-000000000099' },
                  errors: [],
                  meta: { timestamp: new Date().toISOString(), path: url, requestId: null },
                }),
              );
              return;
            }

            if (method === 'PUT' || method === 'PATCH') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  code: 'UPDATED',
                  message: 'Updated successfully (dev mock)',
                  data: { id: url.split('/').pop() },
                  errors: [],
                  meta: { timestamp: new Date().toISOString(), path: url, requestId: null },
                }),
              );
              return;
            }

            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: false,
                code: 'BACKEND_OFFLINE',
                message: `Backend service at ${options.target} is offline.`,
                errors: [],
              }),
            );
          });
        },
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: apiProxyTarget(mode, process.cwd()),
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/tests/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  }
})
