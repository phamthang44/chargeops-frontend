import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Single console app. One origin, one port; role-based routing lives in
// src/RoleRouter.tsx, not in separate deployments.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: ['../..'],
    },
    proxy: {
      '/grafana': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
        ws: true,
      },
      '/ws': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
