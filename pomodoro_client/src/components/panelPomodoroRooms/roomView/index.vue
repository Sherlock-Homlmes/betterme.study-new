<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, ref } from 'vue';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import {
  ChevronLeftIcon,
  MessageCircle2Icon,
  MessageCircle2FilledIcon,
  PencilIcon,
  UsersIcon,
} from 'vue-tabler-icons';
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ControlButton from "@/components/base/uiButton.vue";
import { ButtonImportance } from "@/components/base/types/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePomodoroRoomsStore, type RoomInfo } from '@/stores/pomodoroRooms';
import EditRoomDialog from './EditRoomDialog.vue';
import VideoGrid from './VideoGrid.vue';
import Chat from './Chat.vue';
import ParticipantList from './ParticipantList.vue';

const { t } = useI18n();
const isMobile = useBreakpoints(breakpointsTailwind).smaller('sm');
const {
  isConnected,
  isConnecting,
  error,
  showChat,
  currentRoom,
  flyingReactions,
  joinRoom,
  leaveRoom,
  totalParticipants,
  unreadMessageCount,
  timerSyncedSettings,
  roomNotifications,
  toggleCamera,
  toggleMicrophone,
} = usePomodoroRoomsStore();

const showTimerSyncBanner = ref(false);
const showParticipantList = ref(false);
watch(timerSyncedSettings, (val) => {
  if (val) {
    showTimerSyncBanner.value = true;
    setTimeout(() => { showTimerSyncBanner.value = false; }, 5000);
  }
});

// Props
const props = defineProps<{
  room: RoomInfo;
  initialCam?: boolean;
  initialMic?: boolean;
}>();

// Emit
const emit = defineEmits<{
  back: [];
  leaveRoom: [];
}>();

// State for leave confirmation dialog
const showLeaveDialog = ref(false);

// State for edit room dialog
const showEditDialog = ref(false);

// Computed properties
const connectionStatusText = computed(() => {
  return isConnected.value
    ? t('pomodoroRoom.connected', { default: 'Connected' })
    : t('pomodoroRoom.connecting', { default: 'Connecting...' });
});

// Back button handler (just navigate back without disconnecting)
const handleBackButton = () => {
  emit('back');
};

// Show leave confirmation dialog
const showLeaveConfirmation = () => {
  showLeaveDialog.value = true;
};

// Confirm leave room
const confirmLeaveRoom = () => {
  showLeaveDialog.value = false;
  leaveRoom();
  emit('leaveRoom');
};

// Lifecycle
onMounted(async () => {
  // Already connected to this room (user navigated back then re-entered) → skip re-join
  if (isConnected.value && currentRoom.value?.livekit_room_name === props.room.livekit_room_name) {
    return;
  }
  await joinRoom(props.room);
  // Apply lobby cam/mic choices after connected
  if (props.initialCam) await toggleCamera();
  if (props.initialMic) await toggleMicrophone();
});

// Watch for room prop changes (guards against re-joining same room)
watch(() => props.room, (newRoom) => {
  if (newRoom && !(isConnected.value && currentRoom.value?.livekit_room_name === newRoom.livekit_room_name)) {
    joinRoom(newRoom);
  }
}, { deep: true });
</script>

<template lang="pug">
div(class="flex flex-col h-full")
  // Header
  div(class="flex items-center justify-between px-4 pb-1 border-b border-gray-200 dark:border-gray-700")
    div(class="flex items-center gap-2")
      // Back button without dialog
      ControlButton(
        :aria-label="$t('pomodoroRoom.back', { default: 'Back' })"
        default-style
        circle
        :importance="ButtonImportance.Text"
        @click="handleBackButton"
      )
        ChevronLeftIcon(:size="20")
      div(class="flex items-center gap-2")
        h2(class="font-semibold text-gray-900 dark:text-gray-100")
          | {{ room.room_name }}
        // Edit button
        ControlButton(
          :aria-label="$t('pomodoroRoom.edit_room', { default: 'Edit room' })"
          default-style
          circle
          :importance="ButtonImportance.Text"
          @click="showEditDialog = true"
        )
          PencilIcon(:size="16")
      div(class="flex items-center gap-2")
        div(
          class="flex items-center gap-1 px-2 py-1 text-xs rounded-full text-gray-300 bg-gray-600 dark:bg-green-900 dark:text-green-300"
        )
          span {{ totalParticipants }}/{{ room.limit }}
        // Pomodoro settings chip
        div(
          v-if="room.pomodoro_settings"
          class="hidden sm:flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
          :title="'Pomodoro settings synced to this room'"
        )
          span ⏱ {{ Math.floor(room.pomodoro_settings.pomodoro_study_time / 60) }}m / {{ Math.floor(room.pomodoro_settings.pomodoro_rest_time / 60) }}m

    // Connection status and chat toggle
    div(class="flex items-center")
      // Connection status
      div(
        class="flex items-center gap-1 px-2 py-1 text-xs rounded-full"
        :class="isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'"
      )
        div(
          class="w-2 h-2 rounded-full"
          :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'"
        )
        span
          | {{ connectionStatusText }}

      // Toggle participants button
      ControlButton(
        class='p-1'
        :no-padding="true"
        :aria-label="showParticipantList ? 'Hide participants' : 'Show participants'"
        default-style
        circle
        :importance="showParticipantList ? ButtonImportance.Primary : ButtonImportance.Text"
        @click="showParticipantList = !showParticipantList"
      )
        UsersIcon(:size="20")

      // Toggle chat button
      ControlButton(
        class='p-1 relative'
        :no-padding="true"
        :aria-label="showChat ? 'Hide chat' : 'Show chat'"
        default-style
        circle
        :importance="ButtonImportance.Text"
        @click="showChat = !showChat"
      )
        MessageCircle2Icon(v-if="!showChat" :size="20")
        MessageCircle2FilledIcon(v-else :size="20")
        Badge(
          v-if="!showChat && unreadMessageCount > 0"
          class="absolute -bottom-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center px-1 text-[10px] rounded-full bg-primary dark:bg-primary-dark text-white dark:text-black"
        )
          | {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}

  // Timer sync notification banner
  Transition(name="slide-down")
    div(
      v-if="showTimerSyncBanner && timerSyncedSettings"
      class="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-primary-100 dark:bg-primary-900/40 border-b border-primary-200 dark:border-primary-800 text-sm text-primary-800 dark:text-primary-200"
    )
      span
        | ⏱ {{ $t('pomodoroRoom.timer_synced', { study: timerSyncedSettings.study, rest: timerSyncedSettings.rest, default: `Timer synced: ${timerSyncedSettings.study}m study / ${timerSyncedSettings.rest}m rest` }) }}
      button(@click="showTimerSyncBanner = false" class="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400") ✕

  // Main content
  div(class="flex-grow flex overflow-hidden")
    // Video and chat container
    div(class="flex flex-col flex-grow")
      // Loading state
      div(v-if="isConnecting" class="flex items-center justify-center py-12")
        Loading(size="lg" :text="$t('pomodoroRoom.joining_room', { default: 'Joining room...' })")

      // Error state
      div(v-else-if="error" class="flex flex-col items-center justify-center py-12 px-4")
        p(class="text-red-500 dark:text-red-400 mb-4 text-center")
          | {{ error }}
        Button(@click="joinRoom(room)" variant="outline")
          | {{ $t('pomodoroRoom.retry_join', { default: 'Retry' }) }}

      // Room content
      template(v-else-if="isConnected")
        // Desktop: resizable side-by-side panels
        ResizablePanelGroup(v-if="!isMobile" direction="horizontal" class="h-full")
          // Video grid (main area)
          ResizablePanel(:default-size="showChat || showParticipantList ? 55 : 100" :min-size="35")
            VideoGrid(@leave="leaveRoom" @showLeaveDialog="showLeaveConfirmation")

          ResizableHandle(v-if="showParticipantList || showChat")

          // Participant list panel
          ResizablePanel(v-if="showParticipantList && !showChat" :default-size="45" :min-size="30")
            ParticipantList

          // Chat panel
          ResizablePanel(v-if="showChat && !showParticipantList" :default-size="45" :min-size="35")
            Chat

          // Both open: split right side
          template(v-if="showParticipantList && showChat")
            ResizablePanelGroup(direction="vertical")
              ResizablePanel(:default-size="50" :min-size="30")
                ParticipantList
              ResizableHandle
              ResizablePanel(:default-size="50" :min-size="30")
                Chat

        // Mobile: VideoGrid full screen, panels slide up as overlay
        div(v-else class="relative h-full")
          div(class="h-full")
            VideoGrid(@leave="leaveRoom" @showLeaveDialog="showLeaveConfirmation")
          Transition(name="mobile-panel")
            div(
              v-if="showChat"
              class="absolute inset-0 z-10 bg-white dark:bg-gray-900"
            )
              Chat
          Transition(name="mobile-panel")
            div(
              v-if="showParticipantList && !showChat"
              class="absolute inset-0 z-10 bg-white dark:bg-gray-900"
            )
              ParticipantList

  // Leave room dialog (only shown when disconnect button is clicked)
  AlertDialog(v-model:open="showLeaveDialog")
    AlertDialogContent
      AlertDialogHeader
        AlertDialogTitle
          | {{ $t('pomodoroRoom.leave_room_title', { default: 'Leave Room?' }) }}
      AlertDialogDescription
        | {{ $t('pomodoroRoom.leave_room_description', { default: 'Are you sure you want to leave this room? Your session will be ended.' }) }}
      AlertDialogFooter
        AlertDialogCancel(@click="showLeaveDialog = false")
          | {{ $t('pomodoroRoom.cancel', { default: 'Cancel' }) }}
        AlertDialogAction(@click="confirmLeaveRoom")
          | {{ $t('pomodoroRoom.leave', { default: 'Leave' }) }}

  // Edit room dialog
  EditRoomDialog(v-model:open="showEditDialog" :room="room")

  // Join/Leave notifications
  div(class="absolute top-12 right-3 z-20 flex flex-col gap-1.5 pointer-events-none")
    TransitionGroup(name="notif")
      div(
        v-for="notif in roomNotifications"
        :key="notif.id"
        class="px-3 py-1.5 rounded-lg text-xs font-medium shadow-md"
        :class="notif.type === 'join' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'"
      )
        | {{ notif.message }}

  // Flying reactions overlay
  div(class="fixed inset-0 pointer-events-none overflow-hidden")
    div(
      v-for="reaction in flyingReactions"
      :key="reaction.id"
      class="absolute text-4xl animate-fly-up"
      :style="{ left: reaction.x + '%', bottom: reaction.y + 'px' }"
    )
      | {{ reaction.emoji }}
</template>

<style scoped>
@keyframes fly-up {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-100vh) scale(1.5); opacity: 0; }
}
.animate-fly-up { animation: fly-up 3s ease-out forwards; }

.notif-enter-active { transition: all 0.3s ease; }
.notif-leave-active { transition: all 0.4s ease; }
.notif-enter-from { opacity: 0; transform: translateX(20px); }
.notif-leave-to { opacity: 0; transform: translateX(20px); }

.slide-down-enter-active { transition: all 0.3s ease; }
.slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.mobile-panel-enter-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.mobile-panel-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.mobile-panel-enter-from { transform: translateY(100%); opacity: 0; }
.mobile-panel-leave-to { transform: translateY(100%); opacity: 0; }
</style>
