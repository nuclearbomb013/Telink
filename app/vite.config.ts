import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [
      react({
        // Enable React Compiler for better performance (React 19)
        babel: {
          plugins: [],
        },
      }),
    ],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    // Build optimization
    build: {
      // Enable minification (using esbuild, which is faster)
      minify: 'esbuild',
      
      // Chunk size warning
      chunkSizeWarningLimit: 1000,
      
      // Rollup options for code splitting
      rollupOptions: {
        output: {
          // P2-9: Chunk splitting strategy - separate vendor from app code
          manualChunks(id) {
            if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
              return 'vendor-animations';
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('node_modules/marked') || id.includes('node_modules/dompurify') ||
                id.includes('node_modules/highlight.js')) {
              return 'vendor-markdown';
            }
            if (id.includes('node_modules/mammoth')) {
              return;
            }
            if (id.includes('node_modules')) {
              return 'vendor-other';
            }
          },
          entryFileNames: (chunkInfo) => {
            const name = chunkInfo.name.replace(/^.*[\\/]/, '');
            return `assets/${name}-[hash].js`;
          },
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name.replace(/^.*[\\/]/, '');
            return `assets/${name}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const originalName = assetInfo.originalFileName || assetInfo.name || '';
            const name = originalName.split('/').pop() || originalName;
            const ext = name.split('.').pop() || '';
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(ext)) {
              return `assets/images/${name.replace(/\.[^.]+$/, '')}-[hash].${ext}`;
            }
            if (ext === 'css') {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      
      // Source maps (controlled by env)
      sourcemap: env.VITE_SOURCE_MAP === 'true',
      
      // CSS optimization
      cssMinify: true,
      
      // Asset optimization
      assetsInlineLimit: 4096, // 4KB
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true, // 监听所有局域网 IP
      // Allow sakuraFRP tunnel host
      allowedHosts: ['frp-put.com', '.frp-put.com'],

      // Enable HMR overlay
      hmr: {
        overlay: true,
      },
      // Security headers for dev server (frame-ancestors + X-Frame-Options
      // can't be set via <meta> tags — browsers ignore them there)
      headers: {
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "frame-ancestors 'none';",
      },
      // 反向代理配置 - 解决 CORS 问题
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // Preview server (for testing production build)
    preview: {
      port: 4173,
      host: true,
    },

    // CSS configuration
    css: {
      devSourcemap: true,
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'gsap',
        '@gsap/react',
        'lenis',
        'lucide-react',
      ],
      // Exclude heavy dependencies that should be lazy loaded
      exclude: [],
    },
  };
});
