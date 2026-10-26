/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
      unstubGlobals: true,
    },
    server: {
      // 3000 = Cors:AllowedOrigins and App:FrontendUrl in backend appsettings.Local.json (confirm-email links point here).
      // Explicit IPv4: "localhost" made Vite listen on ::1 only, while Chrome on Windows tries 127.0.0.1 first;
      // a refused loopback connection takes ~2s on Windows before falling back → every new connection was +2s.
      host: '127.0.0.1',
      port: 3000,
      strictPort: true,
      proxy: {
        // Content API (backend launchSettings: https://localhost:7002). Listed first: Vite tries the entries in order.
        // The key is a RegExp tested against the whole URL, query string included (/api/articles?page=1).
        '^/api/(articles|bookmarks|forums)([/?]|$)': { target: env.CONTENT_API_URL || 'https://localhost:7002', changeOrigin: true, secure: false },
        // Identity API (backend launchSettings: https://localhost:7001). Self-signed dev cert → secure: false.
        '/api': { target: env.IDENTITY_API_URL || 'https://localhost:7001', changeOrigin: true, secure: false },
      },
    },
  }
})
