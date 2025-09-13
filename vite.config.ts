import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    allowedHosts: true,
    hmr: {
      overlay: false,
      clientPort: 443,
      protocol: 'wss'
    }
  },
  clearScreen: false,
});