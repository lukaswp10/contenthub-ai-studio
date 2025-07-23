import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: false,
    proxy: {
      '/api/blaze-proxy': {
        target: 'https://blaze.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => '/api/roulette_games/recent?limit=1',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'pt-BR,pt;q=0.9,en;q=0.8');
            proxyReq.setHeader('Referer', 'https://blaze.com/');
            proxyReq.setHeader('Origin', 'https://blaze.com');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Adicionar headers CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          });
        }
      }
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Accept-Ranges'],
      credentials: false,
      exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges']
    },
    fs: {
      allow: ['.']
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ffmpeg': ['@ffmpeg/ffmpeg', '@ffmpeg/util']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      '@supabase/supabase-js', 
      'react', 
      'react-dom',
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util'
    ],
    exclude: ['@ffmpeg/core']
  },
  worker: {
    format: 'es',
    plugins: () => [react()]
  }
}) 