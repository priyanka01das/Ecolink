import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000';
  const port = parseInt(env.VITE_PORT || '3000', 10);

  return {
    plugins: [react()],
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'process.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'EcoLink'),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    server: {
      port: port,
      host: true,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true
        }
      }
    }
  };
});
