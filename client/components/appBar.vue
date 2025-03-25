<script setup>
import { SettingsIcon, ChecklistIcon } from "vue-tabler-icons";
import { ButtonImportance, ButtonTheme } from "./base/types/button";
import CButton from "~~/components/base/uiButton.vue";
import ScheduleView from "@/components/schedule/scheduleDisplay.vue";
import { useOpenPanels } from "@/stores/openpanels";
import { useSettings } from "~~/stores/settings";
import { usePomodoroStore } from "~~/stores/pomodoros";

const { getCurrentItem } = usePomodoroStore();

const openPanels = useOpenPanels();
const settingsStore = useSettings();
</script>

<template>
  <div class="flex flex-row items-center w-full gap-2 px-4 my-1 isolate h-14">
    <div v-show="settingsStore.schedule.visibility.enabled" class="flex-shrink-0 h-10 px-2 py-2 rounded-full bg-surface-dark dark:ring-1 ring-inset dark:ring-surface-ondark dark:ring-opacity-20 overflow-hidden">
      <ClientOnly>
        <ScheduleView />
      </ClientOnly>
    </div>
    <div v-show="settingsStore.schedule.visibility.enabled && settingsStore.schedule.visibility.showSectionType" class="flex-shrink overflow-hidden text-lg whitespace-pre select-none text-ellipsis text-surface-onlight dark:text-surface-ondark" v-text="$t('section.' + getCurrentItem.type).toLowerCase()" />
    <div class="flex-grow" />
    <CButton
      circle
      :theme="openPanels.todo ? ButtonTheme.Primary : ButtonTheme.Neutral"
      :importance="ButtonImportance.Tonal"
      class="transition rounded-full h-11"
      no-content-theme
      no-padding
      inner-class="p-1"
      :aria-label="$t('appbar.todo')"
      @click="openPanels.todo = !openPanels.todo"
    >
      <ChecklistIcon class="inline-block" />
    </CButton>
    <CButton
      circle
      :aria-label="$t('appbar.settings')"
      :importance="ButtonImportance.Filled"
      :theme="ButtonTheme.Neutral"
      class="h-11"
      no-content-theme
      no-padding
      inner-class="p-1"
      @click="openPanels.settings = !openPanels.settings"
    >
      <SettingsIcon class="inline-block" />
    </CButton>

    <!-- <CButton
      circle
      :aria-label="$t('test')"
      :importance="ButtonImportance.Filled"
      :theme="ButtonTheme.Neutral"
      class="h-11"
      no-content-theme
      no-padding
      inner-class="p-1"
      @click="togglePictureInPicture"
    >
      test
    </CButton> -->
  </div>
</template>
