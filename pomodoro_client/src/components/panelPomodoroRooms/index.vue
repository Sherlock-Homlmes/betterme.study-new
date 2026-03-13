<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
// import { until } from "@vueuse/core";
import { XIcon as CloseIcon, UsersIcon, VideoIcon, ChevronLeftIcon } from 'vue-tabler-icons';
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";
import { useOpenPanels } from "@/stores/openpanels";
import { usePomodoroRoomsStore } from '@/stores/pomodoroRooms';
import { useI18n } from 'vue-i18n';
import Panel from "@/components/panel.vue"
import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";
import LoginTab from "@/components/common/loginTab.vue";
import ListRoomView from "./listRoomView.vue";
import RoomView from "./roomView/index.vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const { t } = useI18n();
const { isAuth } = useAuthStore();
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();
const {leaveRoom} = usePomodoroRoomsStore();

// View state: 'list' or 'room'
const currentView = ref<'list' | 'room'>('list');
const selectedRoom = ref<any>(null);

// State for room switching confirmation dialog
const showSwitchRoomDialog = ref(false);
const pendingRoom = ref<any>(null);

// Handle room selection
const handleSelectRoom = (room: any) => {
  // Check if user is already in that room
  if(selectedRoom.value?.livekit_room_name === room.livekit_room_name) currentView.value = 'room';
  // Check if user is switch room
  else if (selectedRoom.value) {
    // Store the pending room and show confirmation dialog
    pendingRoom.value = room;
    showSwitchRoomDialog.value = true;
  } else {
    // No current room, proceed normally
    selectedRoom.value = room;
    currentView.value = 'room';
  }
};

// Confirm room switching
const confirmSwitchRoom = () => {
  // Leave current room first
  leaveRoom();

  // Then select the new room
  selectedRoom.value = pendingRoom.value;
  currentView.value = 'room';

  // Reset dialog state
  showSwitchRoomDialog.value = false;
  pendingRoom.value = null;
};

// Handle back to list
const handleBackToList = () => {
  currentView.value = 'list';
};
const handleLeaveRoom = ()=>{
  currentView.value = 'list';
  selectedRoom.value = null;
}

// Close panel
const handleClose = () => {
  openPanels.pomodoroRooms = false;
};

// onMounted(async () => {
//   await until(isAuth).toBe(true);
// });
</script>

<template lang="pug">
Panel(
  :panel-name='"pomodoroRoom"'
  :require-auth='true'
  :use-divider='true')
  template(#header-icon)
    VideoIcon(:size="24" class="text-primary-500")
  template(#content)
    ListRoomView(
      v-show="currentView === 'list'"
      @select-room="handleSelectRoom"
    )
    RoomView(
      v-if="currentView === 'room' || selectedRoom"
      v-show="currentView === 'room'"
      :room="selectedRoom"
      @back="handleBackToList"
      @leaveRoom="handleLeaveRoom"
    )

    // Room switching confirmation dialog
    AlertDialog(v-model:open="showSwitchRoomDialog")
      AlertDialogContent
        AlertDialogHeader
          AlertDialogTitle
            | {{ $t('pomodoroRoom.switch_room_title', { default: 'Switch Room?' }) }}
        AlertDialogDescription
          | {{ $t('pomodoroRoom.switch_room_description', { default: 'You are already in a room. Do you want to leave the current room and join a new one?' }) }}
        AlertDialogFooter
          AlertDialogCancel(@click="showSwitchRoomDialog = false")
            | {{ $t('pomodoroRoom.cancel') }}
          AlertDialogAction(@click="confirmSwitchRoom")
            | {{ $t('pomodoroRoom.switch') }}
</template>
