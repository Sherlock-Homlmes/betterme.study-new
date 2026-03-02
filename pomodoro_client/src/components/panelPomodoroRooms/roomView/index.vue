<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ChevronLeftIcon,
  MessageCircle2Icon,
  MessageCircle2FilledIcon
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
  showChat,
  currentRoom,
  flyingReactions,
  joinRoom,
  leaveRoom,
  totalParticipants
} = store;

// State for leave confirmation dialog
const showLeaveDialog = ref(false);

// Computed properties
const connectionStatusText = computed(() => {
  return isConnected.value
    ? t('pomodoroRoom.connected', { default: 'Connected' })
    : t('pomodoroRoom.connecting', { default: 'Connecting...' });
});

// Leave room handler (called when VideoGrid emits leave event)
const handleLeaveRoom = () => {
  emit('back');
};

// Show leave confirmation dialog
const showLeaveConfirmation = () => {
  showLeaveDialog.value = true;
};

// Confirm leave room
const confirmLeaveRoom = () => {
  showLeaveDialog.value = false;
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
      AlertDialog(v-model:open="showLeaveDialog")
        AlertDialogTrigger(as-child)
          ControlButton(
            :aria-label="$t('pomodoroRoom.back', { default: 'Back' })"
            default-style
            circle
            :importance="ButtonImportance.Text"
          )
            ChevronLeftIcon(:size="20")
        AlertDialogContent
          AlertDialogHeader
            AlertDialogTitle
              | {{ $t('pomodoroRoom.leave_room_title', { default: 'Leave Room?' }) }}
            AlertDialogDescription
              | {{ $t('pomodoroRoom.leave_room_description', { default: 'Are you sure you want to leave this room? Your session will be ended.' }) }}
          AlertDialogFooter
            AlertDialogCancel
              | {{ $t('pomodoroRoom.cancel', { default: 'Cancel' }) }}
            AlertDialogAction(@click="confirmLeaveRoom")
              | {{ $t('pomodoroRoom.leave', { default: 'Leave' }) }}
      div
        h2(class="font-semibold text-gray-900 dark:text-gray-100")
          | {{ room.room_name }}
      div(
        class="flex items-center gap-1 px-2 py-1 text-xs rounded-full text-gray-300 bg-gray-600 dark:bg-green-900 dark:text-green-300"
      )
        span {{`${totalParticipants}/${room.limit}`}}

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

      // Toggle chat button
      ControlButton(
        class='p-1'
        :no-padding="true"
        :aria-label="showChat ? 'Hide chat' : 'Show chat'"
        default-style
        circle
        :importance="ButtonImportance.Text"
        @click="showChat = !showChat"
      )
        MessageCircle2Icon(v-if="!showChat" :size="20")
        MessageCircle2FilledIcon(v-else :size="20")

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
          VideoGrid(@leave="handleLeaveRoom")

        ResizableHandle(v-if="showChat")

        // Chat panel (right side)
        ResizablePanel(v-if="showChat" :default-size="50" :min-size="40")
          Chat

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
