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
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor libraries
            'vendor': [
              'react',
              'react-dom',
            ],
            // Animation libraries (heavy)
            'animations': [
              'gsap',
              '@gsap/react',
              'lenis',
            ],
            // UI components
            'ui': [
              'lucide-react',
            ],
          },
          // Asset naming for better caching
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') ?? [];
            const ext = info.length > 0 ? info[info.length - 1] : '';
            if (ext && /\.(png|jpe?g|gif|svg|webp|ico)$/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (ext === 'css') {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
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
      // Enable HMR overlay
      hmr: {
        overlay: true,
      },
      // 反向代理配置 - 解决 CORS 问题
      proxy: {
        '/api': {
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
