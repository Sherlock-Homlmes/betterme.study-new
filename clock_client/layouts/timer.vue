<script setup lang="ts"> // eslint-disable-line vue/multi-word-component-names
import { useI18n } from 'vue-i18n'
import SettingsPanel from '@/components/settings/settingsPanel.vue'
import UserSettingPanel from '@/components/userSettingPanel/index.vue'
import AIChatPanel from '@/components/AIChatPanel/index.vue'
import TodoList from '~~/components/todoList/todoList.vue'
import MusicPanel from '~~/components/MusicPanel/index.vue'
import { useOpenPanels } from '~~/stores/openpanels'
import { usePomodoroStore } from "~~/stores/pomodoros";
import { useSettings } from '~~/stores/settings'

const openPanels = useOpenPanels()
const settingsStore = useSettings()
const { timerState } = usePomodoroStore()

const { locale } = useI18n()

useHead(() => {
  return {
    htmlAttrs: { lang: locale }
  }
})
</script>

<template>
  <div class="relative w-full h-full">
    <transition enter-from-class="opacity-0" enter-active-class="transition duration-300" leave-to-class="opacity-0" leave-active-class="transition">
      <!-- Darkening overlay -->
      <div v-show="openPanels.settings" class="fixed z-40 w-screen h-screen bg-black bg-opacity-40" />
    </transition>
    <transition enter-from-class="translate-x-32 opacity-0" enter-active-class="transition duration-300 ease-out" leave-to-class="scale-95 opacity-0" leave-active-class="transition ease-in">
      <SettingsPanel v-show="openPanels.settings" class="right-0" />
    </transition>
    <transition enter-from-class="translate-y-full" enter-active-class="duration-300 ease-out" leave-to-class="translate-y-full" leave-active-class="duration-150 ease-in">
      <TodoList v-if="openPanels.todo" class="fixed bottom-0 z-10 w-full md:max-w-lg transition-all rounded-t-xl md:right-4 md:pb-8" :editing="[0].includes(timerState)" @hide="openPanels.todo = false" />
    </transition>
    <transition enter-from-class="translate-y-full" enter-active-class="duration-300 ease-out" leave-to-class="translate-y-full" leave-active-class="duration-150 ease-in">
      <UserSettingPanel v-show="openPanels.user" class="right-0" />
    </transition>
    <transition enter-from-class="translate-y-full" enter-active-class="duration-300 ease-out" leave-to-class="translate-y-full" leave-active-class="duration-150 ease-in">
      <AIChatPanel v-show="openPanels.ai" class="right-0" />
    </transition>
    <transition enter-from-class="translate-y-full" enter-active-class="duration-300 ease-out" leave-to-class="translate-y-full" leave-active-class="duration-150 ease-in">
      <MusicPanel v-show="openPanels.music" class="right-0" />
    </transition>
    <slot />
  </div>
</template>

<style>
/* stylelint-disable-next-line selector-id-pattern */
html, body, #__nuxt {
  height: 100%;
}
</style>
