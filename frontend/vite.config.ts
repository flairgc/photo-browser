import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), svgr()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_API_HOST,
          changeOrigin: true,
          secure: false,
        },
      },
      allowedHosts: env.VITE_ALLOWED_HOST
        ? [env.VITE_ALLOWED_HOST]
        : [],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }
})