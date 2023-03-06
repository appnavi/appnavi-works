import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react(), visualizer()],
  server: {
    watch: {
      usePolling: true,
    },
    port: 3000,
    host: true,
    proxy: {
      '/api': 'http://localhost:5000',
      '/auth/slack': 'http://localhost:5000',
      '/auth/slack/redirect': 'http://localhost:5000',
      '/auth/logout': 'http://localhost:5000',
      // "/upload": "http://localhost:5000",
    },
  },
});
