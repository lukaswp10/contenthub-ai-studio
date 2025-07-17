import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: false,
    headers: {
      // Headers mais permissivos para permitir vídeos
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Accept-Ranges'],
      credentials: false, // Alterado para false para evitar conflitos
      exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@supabase/supabase-js', 
      'react', 
      'react-dom',
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util'
    ],
    exclude: ['@ffmpeg/core'],
  },
  worker: {
    format: 'es'
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            '@radix-ui/react-tabs'
          ],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 4173,
    host: true,
  },
}) 