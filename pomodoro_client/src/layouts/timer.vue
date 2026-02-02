<script setup lang="ts"> // eslint-disable-line vue/multi-word-component-names
import SettingsPanel from '@/components/panelSettings/index.vue'
import StatisticPanel from '@/components/panelStatistic/index.vue'
import AIChatPanel from '@/components/panelAIChat/index.vue'
import TaskPanel from '@/components/panelTask/index.vue'
import VoiceChannelPanel from '@/components/voiceChannelPanel/index.vue'
import { useOpenPanels } from '@/stores/openpanels'
import { usePomodoroStore } from "@/stores/pomodoros";
import { useSettings } from '@/stores/settings'

const openPanels = useOpenPanels()
const { timerState } = usePomodoroStore()
</script>

<template lang="pug">
div(class="relative w-screen h-screen")
  transition(enter-from-class="opacity-0" enter-active-class="transition duration-300" leave-to-class="opacity-0" leave-active-class="transition")
    div(v-show="openPanels.settings || openPanels.ai || openPanels.statistic || openPanels.voiceChannel" class="fixed z-40 w-screen h-screen bg-black/40")
  transition(enter-from-class="translate-x-32 opacity-0" enter-active-class="transition duration-300 ease-out" leave-to-class="scale-95 opacity-0" leave-active-class="transition ease-in")
    SettingsPanel(v-show="openPanels.settings" class="right-0")
  transition(enter-from-class="translate-y-full" enter-active-class="duration-300 ease-out" leave-to-class="translate-y-full" leave-active-class="duration-150 ease-in")
    TaskPanel(v-if="openPanels.todo" class="fixed bottom-0 z-10 w-full md:max-w-lg transition-all rounded-t-xl md:right-4 md:pb-8" :editing="[0].includes(timerState)" @hide="openPanels.todo = false")
  transition(enter-from-class="translate-x-32 opacity-0" enter-active-class="transition duration-300 ease-out" leave-to-class="scale-95 opacity-0" leave-active-class="transition ease-in")
    StatisticPanel(v-show="openPanels.statistic" class="right-0")
  transition(enter-from-class="translate-x-32 opacity-0" enter-active-class="transition duration-300 ease-out" leave-to-class="scale-95 opacity-0" leave-active-class="transition ease-in")
    AIChatPanel(v-show="openPanels.ai" class="right-0")
  transition(enter-from-class="translate-x-32 opacity-0" enter-active-class="transition duration-300 ease-out" leave-to-class="scale-95 opacity-0" leave-active-class="transition ease-in")
    VoiceChannelPanel(v-show="openPanels.voiceChannel" class="right-0")
  slot
</template>

<style>
html, body {
  height: 100%;
}
</style>
