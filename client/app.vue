<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~~/stores/auth'


if (!process.server) {
  useHead({
    link: [
      {
        rel: 'manifest',
        href: '/app_manifest.json'
      },
      {
        rel: 'apple-touch-icon',
        href: '/icons/icon-apple-192.png'
      }
    ],
    meta: [
      { name: 'theme-color', content: '#F87171' }
    ]
  })

  onMounted(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        const registerSw = () => {
          console.debug('Registering service worker at /serviceworker.js')
          navigator.serviceWorker.register('/serviceworker.js')
        }

        if (document.readyState === 'complete') {
          registerSw()
        } else {
          window.addEventListener('load', registerSw)
        }
      }
    }
  })
}

const {isDarkMode} = useAuthStore()!

watch(
  isDarkMode,
  (newDarkMode) => {
    useHead({
      bodyAttrs: {
        class: newDarkMode ? 'dark' : undefined
      }
    })
  }
)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
