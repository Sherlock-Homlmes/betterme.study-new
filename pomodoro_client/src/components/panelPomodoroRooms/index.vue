<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { until } from "@vueuse/core";
import { XIcon as CloseIcon, UsersIcon, VideoIcon, ChevronLeftIcon } from 'vue-tabler-icons';
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";
import { useOpenPanels } from "@/stores/openpanels";
import { useI18n } from 'vue-i18n';
import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";
import LoginTab from "@/components/common/loginTab.vue";
import ListRoomView from "./listRoomView.vue";
import RoomView from "./roomView.vue";

const { t } = useI18n();
const { isAuth } = useAuthStore();
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();

// View state: 'list' or 'room'
const currentView = ref<'list' | 'room'>('list');
const selectedRoom = ref<any>(null);

// Handle room selection
const handleSelectRoom = (room: any) => {
  selectedRoom.value = room;
  currentView.value = 'room';
};

// Handle back to list
const handleBackToList = () => {
  currentView.value = 'list';
  selectedRoom.value = null;
};

// Close panel
const handleClose = () => {
  openPanels.pomodoroRooms = false;
};

onMounted(async () => {
  await until(isAuth).toBe(true);
});
</script>

<template lang="pug">
section(class="fixed z-40 w-full h-full p-0 md:p-4 md:max-w-3xl")
  div(class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" :style="{ 'padding-top': `${mobileSettingsStore.padding.top}px`, 'padding-bottom': `${mobileSettingsStore.padding.bottom}px` }")
    // Header
    h1(class="px-4 mt-4 mb-2 text-xl font-bold uppercase flex items-center gap-2")
      VideoIcon(:size="24" class="text-primary-500")
      span {{ $t('pomodoro_rooms.heading', { default: 'Pomodoro Rooms' }) }}
      ControlButton(
        class="float-right -mt-2 -mr-2"
        :aria-label="$t('settings.buttons.close')"
        default-style
        circle
        :importance="ButtonImportance.Text"
        tabindex="0"
        @click="handleClose"
      )
        CloseIcon(:aria-label="$t('settings.buttons.close')")
    
    // Content
    div(class="flex-grow overflow-y-auto")
      div(v-if="!isAuth" class="grid grid-cols-1 gap-2 py-3 px-4 h-full")
        LoginTab
      div(v-else class="h-full")
        // List View
        ListRoomView(
          v-if="currentView === 'list'"
          @select-room="handleSelectRoom"
        )
        // Room View
        RoomView(
          v-else-if="currentView === 'room' && selectedRoom"
          :room="selectedRoom"
          @back="handleBackToList"
        )
</template>
