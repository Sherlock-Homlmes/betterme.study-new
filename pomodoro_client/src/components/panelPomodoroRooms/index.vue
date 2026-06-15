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
import PreJoinLobby from "./PreJoinLobby.vue";
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

// View state: 'list', 'lobby', or 'room'
const currentView = ref<'list' | 'lobby' | 'room'>('list');
const selectedRoom = ref<any>(null);

// pre-join lobby cam/mic choices
const lobbyInitialCam = ref(false);
const lobbyInitialMic = ref(false);

// State for room switching confirmation dialog
const showSwitchRoomDialog = ref(false);
const pendingRoom = ref<any>(null);

// Handle newly created room → skip lobby, join directly
const handleCreateRoom = (room: any) => {
  leaveRoom();
  selectedRoom.value = room;
  lobbyInitialCam.value = false;
  lobbyInitialMic.value = false;
  currentView.value = 'room';
};

// Handle room selection → go to lobby first
const handleSelectRoom = (room: any) => {
  // Already in that room → just go back to room view
  if (selectedRoom.value?.livekit_room_name === room.livekit_room_name) {
    currentView.value = 'room';
  } else if (selectedRoom.value) {
    // Switching room → confirm first
    pendingRoom.value = room;
    showSwitchRoomDialog.value = true;
  } else {
    // Fresh join → lobby
    selectedRoom.value = room;
    currentView.value = 'lobby';
  }
};

// Confirm room switching
const confirmSwitchRoom = () => {
  leaveRoom();
  selectedRoom.value = pendingRoom.value;
  currentView.value = 'lobby';
  showSwitchRoomDialog.value = false;
  pendingRoom.value = null;
};

// Lobby: user confirmed cam/mic settings → join for real
const handleLobbyJoin = (cam: boolean, mic: boolean) => {
  lobbyInitialCam.value = cam;
  lobbyInitialMic.value = mic;
  currentView.value = 'room';
};

// Handle back to list from lobby
const handleBackToList = () => {
  currentView.value = 'list';
};

// Handle back from roomView to lobby (without leaving)
const handleBackFromRoom = () => {
  currentView.value = 'list';
};

const handleLeaveRoom = () => {
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
      @create-room="handleCreateRoom"
    )
    PreJoinLobby(
      v-if="currentView === 'lobby' && selectedRoom"
      :room="selectedRoom"
      @join="handleLobbyJoin"
      @back="handleBackToList"
    )
    RoomView(
      v-if="currentView === 'room' && selectedRoom"
      :room="selectedRoom"
      :initial-cam="lobbyInitialCam"
      :initial-mic="lobbyInitialMic"
      @back="handleBackFromRoom"
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
