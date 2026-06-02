import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath, URL } from "node:url";
import { visualizer } from 'rollup-plugin-visualizer'


// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
const allowedHosts = null;

function asyncCssPlugin(): Plugin {
  return {
    name: 'async-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link rel="stylesheet"([^>]*)>/g,
          (_match, attrs) =>
            `<link rel="preload" as="style"${attrs} onload="this.rel='stylesheet'"><noscript><link rel="stylesheet"${attrs}></noscript>`
        )
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  css: {
    transformer: 'lightningcss',
  },
  build: {
    cssMinify: 'lightningcss',
    target: 'es2022',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-livekit': ['livekit-client'],
          'vendor-d3': [
            'd3-axis', 'd3-array', 'd3-color', 'd3-format',
            'd3-interpolate', 'd3-scale', 'd3-selection',
            'd3-time', 'd3-transition', 'd3-time-format',
            'd3-shape', 'd3-path'
          ],
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-reka': ['reka-ui'],
          'vendor-vueuse': ['@vueuse/core'],
        }
      }
    }
  },
  plugins: [
    tailwindcss(),
    vue(),
    VueI18nPlugin({
      include: './src/i18n/**',
    }),
    asyncCssPlugin(),
    visualizer({
      open: true,           // tự mở browser sau build
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    allowedHosts: allowedHosts || true,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1420,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      'vue': 'vue/dist/vue.runtime.esm-bundler.js',
    }
  }
}));
