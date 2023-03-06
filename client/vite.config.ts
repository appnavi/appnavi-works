import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  server: {
    watch: {
      usePolling: true,
    },
    port: 3000,
    host: true,
    proxy: {
      '/api': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
      // "/upload": "http://localhost:5000",
    },
  },
});
