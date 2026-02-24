<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ChevronLeftIcon,
  MicrophoneIcon,
  MicrophoneOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneOffIcon,
  Volume2Icon,
  VolumeOffIcon
} from 'vue-tabler-icons';
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import ControlButton from "@/components/base/uiButton.vue";
import { ButtonImportance } from "@/components/base/types/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { usePomodoroRoomsStore, type RoomInfo } from '@/stores/pomodoroRooms';
import VideoGrid from './VideoGrid.vue';
import Chat from './Chat.vue';

const { t } = useI18n();
const store = usePomodoroRoomsStore();

// Props
const props = defineProps<{
  room: RoomInfo;
}>();

// Emit
const emit = defineEmits<{
  back: [];
}>();

const {
  isConnected,
  isConnecting,
  error,
  isMicEnabled,
  isCameraEnabled,
  isSpeakerEnabled,
  showChat,
  currentRoom,
  flyingReactions,
  joinRoom,
  leaveRoom,
  toggleMicrophone,
  toggleCamera,
  toggleSpeaker,
  totalParticipants
} = store;

// Computed properties
const connectionStatusText = computed(() => {
  return isConnected.value
    ? t('pomodoroRoom.connected', { default: 'Connected' })
    : t('pomodoroRoom.connecting', { default: 'Connecting...' });
});

// Leave room handler
const handleLeaveRoom = () => {
  leaveRoom();
  emit('back');
};

// Lifecycle
onMounted(() => {
  joinRoom(props.room);
});

onUnmounted(() => {
  leaveRoom();
});

// Watch for room prop changes
watch(() => props.room, (newRoom) => {
  if (newRoom) {
    joinRoom(newRoom);
  }
}, { deep: true });
</script>

<template lang="pug">
div(class="flex flex-col h-full")
  // Header
  div(class="flex items-center justify-between px-4 pb-1 border-b border-gray-200 dark:border-gray-700")
    div(class="flex items-center gap-2")
      ControlButton(
        :aria-label="$t('pomodoroRoom.back', { default: 'Back' })"
        default-style
        circle
        :importance="ButtonImportance.Text"
        @click="handleLeaveRoom"
      )
        ChevronLeftIcon(:size="20")
      div
        h2(class="font-semibold text-gray-900 dark:text-gray-100")
          | {{ room.room_name }}
      div(
        class="flex items-center gap-1 px-2 py-1 text-xs rounded-full text-gray-300 bg-gray-600 dark:bg-green-900 dark:text-green-300"
      )
        span {{`${totalParticipants}/${room.limit}`}}
    
    // Connection status and chat toggle
    div(class="flex items-center gap-2")
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
      
      // Toggle chat button
      ControlButton(
        :aria-label="showChat ? 'Hide chat' : 'Show chat'"
        default-style
        circle
        :importance="showChat ? ButtonImportance.Primary : ButtonImportance.Secondary"
        @click="showChat = !showChat"
      )
        span(class="text-lg") 💬

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
      ResizablePanelGroup(v-else-if="isConnected" direction="horizontal" class="h-full")
        // Video grid (left side)
        ResizablePanel(:default-size="showChat ? 50 : 100" :min-size="35")
          VideoGrid
      
        ResizableHandle(v-if="showChat")
        
        // Chat panel (right side)
        ResizablePanel(v-if="showChat" :default-size="50" :min-size="40")
          Chat

      // Controls bar (full width at bottom)
      div(class="flex items-center justify-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900")
        // Microphone toggle
        ControlButton(
          :aria-label="isMicEnabled ? $t('pomodoroRoom.mute_mic', { default: 'Mute microphone' }) : $t('pomodoroRoom.unmute_mic', { default: 'Unmute microphone' })"
          default-style
          circle
          :importance="isMicEnabled ? ButtonImportance.Primary : ButtonImportance.Secondary"
          size="lg"
          @click="toggleMicrophone"
        )
          MicrophoneIcon(v-if="isMicEnabled" :size="24")
          MicrophoneOffIcon(v-else :size="24")
        
        // Camera toggle
        ControlButton(
          :aria-label="isCameraEnabled ? $t('pomodoroRoom.turn_off_camera', { default: 'Turn off camera' }) : $t('pomodoroRoom.turn_on_camera', { default: 'Turn on camera' })"
          default-style
          circle
          :importance="isCameraEnabled ? ButtonImportance.Primary : ButtonImportance.Secondary"
          size="lg"
          @click="toggleCamera"
        )
          VideoIcon(v-if="isCameraEnabled" :size="24")
          VideoOffIcon(v-else :size="24")
        
        // Speaker toggle
        ControlButton(
          :aria-label="isSpeakerEnabled ? $t('pomodoroRoom.mute_speaker', { default: 'Mute speaker' }) : $t('pomodoroRoom.unmute_speaker', { default: 'Unmute speaker' })"
          default-style
          circle
          :importance="isSpeakerEnabled ? ButtonImportance.Secondary : ButtonImportance.Text"
          size="lg"
          @click="toggleSpeaker"
        )
          Volume2Icon(v-if="isSpeakerEnabled" :size="24")
          VolumeOffIcon(v-else :size="24")
        
        // Leave room button
        ControlButton(
          :aria-label="$t('pomodoroRoom.leave_room', { default: 'Leave room' })"
          default-style
          circle
          :importance="ButtonImportance.Danger"
          size="lg"
          @click="handleLeaveRoom"
        )
          PhoneOffIcon(:size="24")

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
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(1.5);
    opacity: 0;
  }
}

.animate-fly-up {
  animation: fly-up 3s ease-out forwards;
}
</style>
