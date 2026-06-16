import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath, URL } from "node:url";


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
        // Function form: groups by resolved module path, so it does NOT require
        // the packages (e.g. d3-* pulled in transitively by @unovis) to be
        // direct dependencies.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('livekit-client')) return 'vendor-livekit'
          if (id.includes('@unovis') || id.includes('/d3-') || id.includes('\\d3-')) return 'vendor-d3'
          if (id.includes('reka-ui')) return 'vendor-reka'
          if (id.includes('@vueuse')) return 'vendor-vueuse'
          if (
            id.includes('vue-router') ||
            id.includes('vue-i18n') ||
            id.includes('@intlify') ||
            /[\\/]node_modules[\\/]vue[\\/]/.test(id)
          ) return 'vendor-vue'
        },
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
