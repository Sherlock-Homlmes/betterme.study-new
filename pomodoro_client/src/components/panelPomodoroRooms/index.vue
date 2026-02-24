<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { until } from "@vueuse/core";
import { XIcon as CloseIcon, UsersIcon, VideoIcon, ChevronLeftIcon } from 'vue-tabler-icons';
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";
import { useOpenPanels } from "@/stores/openpanels";
import { useI18n } from 'vue-i18n';
import Panel from "@/components/panel.vue"
import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";
import LoginTab from "@/components/common/loginTab.vue";
import ListRoomView from "./listRoomView.vue";
import RoomView from "./roomView/index.vue";

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
Panel(
  :panel-name='"pomodoroRoom"'
  :require-auth='true'
  :use-divider='true')
  //- template(#header-icon)
    VideoIcon(:size="24" class="text-primary-500")
  template(#content)
      ListRoomView(
        v-if="currentView === 'list'"
        @select-room="handleSelectRoom"
      )
      RoomView(
        v-else-if="currentView === 'room' && selectedRoom"
        :room="selectedRoom"
        @back="handleBackToList"
      )
</template>
