import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0', // هذا يسمح بالوصول من أي شبكة، وهو ضروري لـ Replit
    port: 5000,
    strictPort: true,
    open: false,
    hmr: {
      // هذه الإعدادات ضرورية لعمل التحديث المباشر (HMR) بشكل صحيح على Replit
      clientPort: 443,
      protocol: 'wss'
    }
  },
});
