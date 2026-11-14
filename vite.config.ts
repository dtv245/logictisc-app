import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { createLogger, defineConfig, loadEnv } from 'vite'
import { createOfflineProxyResponse } from './src/config/devProxyOffline.ts'

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
      (msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET') || msg.includes('502'))
    ) {
      if (!warnedBackendOffline) {
        warnedBackendOffline = true
        logger.warn(
          `\n⚠️  [vite] Backend API không khả dụng hoặc vừa khởi động lại tại ${target}. Proxy trả lỗi thật (fail-closed); không có mock data.\n`,
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
      '@forms': fileURLToPath(new URL('./src/forms', import.meta.url)),
      '@table': fileURLToPath(new URL('./src/table', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@formatters': fileURLToPath(new URL('./src/formatters', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@providers': fileURLToPath(new URL('./src/providers', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@test': fileURLToPath(new URL('./src/tests', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@locales': fileURLToPath(new URL('./src/locales', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget(mode, process.cwd()),
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            const url = req.url || '';
            if (!res || !('writeHead' in res) || res.headersSent) {
              return;
            }

            // Fail closed. Never fabricate identity, list rows or write success
            // when the real backend is unreachable.
            const offline = createOfflineProxyResponse(url, req.method || 'GET', target);
            res.writeHead(offline.statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(offline.payload));
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
    testTimeout: 20000,
    include: ['src/tests/**/*.test.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./src/tests/setup.ts'],
    // Tests must not depend on a developer's gitignored `.env`. CI only sees
    // the tracked files, so these values are defined here explicitly. The
    // MapShell tests mock Mapbox itself; they only need a non-empty style URL
    // and a public-token-shaped value to get past the production guards.
    env: {
      VITE_API_BASE_URL: 'http://localhost:8080/api',
      VITE_MAPBOX_STYLE_URL: 'mapbox://styles/mapbox/streets-v12',
      VITE_MAPBOX_ACCESS_TOKEN: 'pk.test-public-token',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  }
})
