import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useProxy = env.VITE_USE_PROXY_ML === 'true'
  const proxyTarget = env.VITE_ML_API_BASE || 'http://localhost:5000'
  return {
    plugins: [react(), tailwindcss()],
    server: useProxy
      ? {
          proxy: {
            // Redirect /ml/* to the Python ML service to avoid CORS in dev
            '/ml': {
              target: proxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/ml/, ''),
            },
          },
        }
      : undefined,
  }
})
