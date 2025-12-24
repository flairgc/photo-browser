import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  const url = new URL(env.VITE_BACKEND_API_HOST);
  if (env.BACKEND_PORT) url.port = process.env.NODE_ENV === 'production' ? env.BACKEND_PORT : env.BACKEND_PORT_DEV;

  const proxyTarget = url.toString();

  return {
    plugins: [react(), svgr()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
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