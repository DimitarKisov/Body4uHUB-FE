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
    server: {
      // 3000 = Cors:AllowedOrigins and App:FrontendUrl in backend appsettings.Local.json (confirm-email links point here).
      port: 3000,
      strictPort: true,
      proxy: {
        // Identity API (backend launchSettings: https://localhost:7001). Self-signed dev cert → secure: false.
        '/api': { target: env.IDENTITY_API_URL || 'https://localhost:7001', changeOrigin: true, secure: false },
      },
    },
  }
})
