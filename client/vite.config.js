import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,          // expose to local network (0.0.0.0) so mobile can connect
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'motion':         ['framer-motion'],
          'charts':         ['recharts'],
          'ui':             ['lucide-react', 'react-hot-toast'],
          'state':          ['zustand', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
