<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, ref } from 'vue';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import { Spinner } from '@/components/ui/spinner';
import { usePomodoroRoomsStore, type RoomInfo } from '@/stores/pomodoroRooms';
import { api } from '@/utils/betterFetch';
import { runtimeConfig } from '@/config/runtimeConfig';
import VideoGrid from './VideoGrid.vue';
import Chat from './Chat.vue';
import ParticipantList from './ParticipantList.vue';

const { t } = useI18n();
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
const updatingRoom = ref(false);
const updateError = ref<string | null>(null);

// Edit room form
const editRoomForm = ref({
  room_name: '',
  pomodoro_settings: {
    pomodoro_study_time: 25,
    pomodoro_rest_time: 5,
    pomodoro_long_rest_time: 20,
    long_rest_time_interval: 3,
  },
});

// Build API URL
const buildApiUrl = (path: string) => {
  return `${runtimeConfig.public.API_URL}/v2/pomodoro-rooms${path}`;
};

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

// Open edit dialog and populate form with current room data
const openEditDialog = () => {
  editRoomForm.value = {
    room_name: props.room.room_name,
    pomodoro_settings: {
      pomodoro_study_time: Math.floor((props.room.pomodoro_settings?.pomodoro_study_time || 25 * 60) / 60),
      pomodoro_rest_time: Math.floor((props.room.pomodoro_settings?.pomodoro_rest_time || 5 * 60) / 60),
      pomodoro_long_rest_time: Math.floor((props.room.pomodoro_settings?.pomodoro_long_rest_time || 20 * 60) / 60),
      long_rest_time_interval: props.room.pomodoro_settings?.long_rest_time_interval || 3,
    },
  };
  updateError.value = null;
  showEditDialog.value = true;
};

// Update room
const updateRoom = async () => {
  if (!editRoomForm.value.room_name.trim()) {
    updateError.value = t('pomodoroRoom.errors.room_name_required', { default: 'Room name is required' });
    return;
  }

  try {
    updatingRoom.value = true;
    updateError.value = null;

    const response = await api.patch(buildApiUrl(`/${props.room.livekit_room_name}`), {
      room_name: editRoomForm.value.room_name.trim(),
      pomodoro_settings: {
        pomodoro_study_time: editRoomForm.value.pomodoro_settings.pomodoro_study_time * 60,
        pomodoro_rest_time: editRoomForm.value.pomodoro_settings.pomodoro_rest_time * 60,
        pomodoro_long_rest_time: editRoomForm.value.pomodoro_settings.pomodoro_long_rest_time * 60,
        long_rest_time_interval: editRoomForm.value.pomodoro_settings.long_rest_time_interval,
      },
    });

    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
    }

    const updatedRoom = await response.json();

    // Close dialog and emit update event
    showEditDialog.value = false;
  } catch (err: any) {
    updateError.value = err.message || t('pomodoroRoom.errors.update_failed', { default: 'Failed to update room' });
    console.error('Error updating room:', err);
  } finally {
    updatingRoom.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  await joinRoom(props.room);
  // Apply lobby cam/mic choices after connected
  if (props.initialCam) await toggleCamera();
  if (props.initialMic) await toggleMicrophone();
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
          @click="openEditDialog"
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
      ResizablePanelGroup(v-else-if="isConnected" direction="horizontal" class="h-full")
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

  // Leave room dialog (only shown when disconnect button is clicked)
  AlertDialog(v-model:open="showLeaveDialog")
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

  // Edit room dialog
  Dialog(v-model:open="showEditDialog")
    form
      DialogContent(class="sm:max-w-[425px]")
        DialogHeader
          DialogTitle {{ $t('pomodoroRoom.editDialog.title', { default: 'Edit Room' }) }}
        div(class="grid gap-4")
          // Error message
          div(v-if="updateError" class="text-red-500 dark:text-red-400 text-sm")
            | {{ updateError }}
          // Room name
          div(class="grid gap-3")
            Label(for="edit-room-name")
              | {{ $t('pomodoroRoom.createDialog.room_name_label', { default: 'Room name' }) }}
              span(class="text-red-500") *
            Input(
              id="edit-room-name" name="room name"
              v-model="editRoomForm.room_name"
              :placeholder="$t('pomodoroRoom.createDialog.room_name_placeholder', { default: 'Enter room name' })"
              @keyup.enter="updateRoom"
            )

          // Pomodoro settings
          div(class="border-t border-gray-200 dark:border-gray-700 pt-4")
            h4(class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3")
              | {{ $t('pomodoroRoom.createDialog.pomodoro_settings_label', { default: 'Pomodoro Settings' }) }}
            // Study time
            NumberField(
              id="edit-study_time" class="mb-2"
              v-model="editRoomForm.pomodoro_settings.pomodoro_study_time"
              :min="5" :max="180"
            )
              Label(for="edit-study_time")
                | {{ $t('pomodoroRoom.createDialog.study_time_label', { default: 'Study time' }) }}
                span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
              NumberFieldContent
                NumberFieldDecrement
                NumberFieldInput
                NumberFieldIncrement

            // Rest time
            NumberField(
              id="edit-rest_time" class="mb-2"
              v-model="editRoomForm.pomodoro_settings.pomodoro_rest_time"
              :min="1" :max="180"
            )
              Label(for="edit-rest_time")
                | {{ $t('pomodoroRoom.createDialog.rest_time_label', { default: 'Rest time' }) }}
                span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
              NumberFieldContent
                NumberFieldDecrement
                NumberFieldInput
                NumberFieldIncrement

            // Long rest time
            NumberField(
              id="edit-long_rest_time" class="mb-2"
              v-model="editRoomForm.pomodoro_settings.pomodoro_long_rest_time"
              :min="1" :max="180"
            )
              Label(for="edit-long_rest_time")
                | {{ $t('pomodoroRoom.createDialog.long_rest_time_label', { default: 'Long rest time' }) }}
                span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
              NumberFieldContent
                NumberFieldDecrement
                NumberFieldInput
                NumberFieldIncrement

            // Long rest interval
            NumberField(
              id="edit-long_rest_interval"
              v-model="editRoomForm.pomodoro_settings.long_rest_time_interval"
              :min="2" :max="10"
            )
              Label(for="edit-long_rest_interval")
                |{{ $t('pomodoroRoom.createDialog.long_rest_interval_label', { default: 'Long rest interval' }) }}
                span(class="text-gray-500") &nbsp(2-10)
              NumberFieldContent
                NumberFieldDecrement
                NumberFieldInput
                NumberFieldIncrement
        DialogFooter
          DialogClose(as-child)
            Button(
              variant="outline"
              :disabled="updatingRoom"
            ) {{ $t('pomodoroRoom.createDialog.cancel', { default: 'Cancel' }) }}
          Button(
            type="submit"
            :disabled="updatingRoom || !editRoomForm.room_name.trim()"
            @click='updateRoom'
          )
            Spinner(v-if="updatingRoom")
            |{{ updatingRoom ? $t('pomodoroRoom.editDialog.updating', { default: 'Updating...' }) : $t('pomodoroRoom.editDialog.update', { default: 'Update' }) }}

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
</style>
