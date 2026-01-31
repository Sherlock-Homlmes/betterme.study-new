<script setup>
import {
	SettingsIcon,
	ChecklistIcon,
	UserIcon,
	MessageChatbotIcon,
} from "vue-tabler-icons";
import { ButtonImportance, ButtonTheme } from "./base/types/button";
import CButton from "@/components/base/uiButton.vue";
import { MusicIcon } from "vue-tabler-icons";
import ScheduleView from "@/components/schedule/scheduleDisplay.vue";
import { useOpenPanels } from "@/stores/openpanels";
import { useSettings } from "@/stores/settings";
import { usePomodoroStore } from "@/stores/pomodoros";

const { getCurrentItem } = usePomodoroStore();

const openPanels = useOpenPanels();
const settingsStore = useSettings();
</script>

<template>
  <div class="flex flex-row items-center w-full gap-2 px-4 my-1 isolate h-14">
    <div v-show="settingsStore.schedule.visibility.enabled" class="flex-shrink-0 h-10 px-2 py-2 rounded-full bg-surface-dark dark:ring-1 ring-inset dark:ring-surface-ondark dark:ring-opacity-20 overflow-hidden">
      <ScheduleView />
    </div>
    <div v-show="settingsStore.schedule.visibility.enabled && settingsStore.schedule.visibility.showSectionType" class="flex-shrink overflow-hidden text-lg whitespace-pre select-none text-ellipsis text-surface-onlight dark:text-surface-ondark" v-text="$t('section.' + getCurrentItem.type).toLowerCase()" />
    <div class="flex-grow" />
    <CButton
      circle
      :theme="openPanels.ai ? ButtonTheme.Primary : ButtonTheme.Neutral"
      :importance="ButtonImportance.Tonal"
      class="transition rounded-full h-11"
      no-content-theme
      no-padding
      inner-class="p-1"
      :aria-label="$t('appbar.ai')"
      @click="openPanels.ai = !openPanels.ai"
      key='ai'
    >
      <MessageChatbotIcon class="inline-block" />
    </CButton>
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
      key='todo'
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
      @click="openPanels.user = !openPanels.user"
      key='user'
    >
      <UserIcon class="inline-block" />
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
      key='setting'
    >
      <SettingsIcon class="inline-block" />
    </CButton>
  </div>
</template>
