<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useEventSource } from '@vueuse/core';
import { runtimeConfig } from '@/config/runtimeConfig';
import { api } from '@/utils/betterFetch';
import { UsersIcon, PlusIcon, RefreshIcon, VideoIcon, XIcon as CloseIcon, SearchIcon, CircleXIcon } from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";
import { usePomodoroRoomsStore } from '@/stores/pomodoroRooms';
import { ButtonGroup } from '@/components/ui/button-group';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { Spinner } from '@/components/ui/spinner'

const { t } = useI18n();
const {
  currentRoom,
} = usePomodoroRoomsStore();

// Room data types
interface PomodoroRoom {
  room_name: string;
  livekit_room_name: string;
  limit: number;
  num_participants: number;
  created_by: string;
  created_at: string;
  pomodoro_settings?: {
    pomodoro_study_time: number;
    pomodoro_rest_time: number;
    pomodoro_long_rest_time?: number;
    long_rest_time_interval?: number;
  };
}

// State
const rooms = ref<PomodoroRoom[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const refreshing = ref(false);
const showCreateModal = ref(false);
const creatingRoom = ref(false);
const searchQuery = ref('');

// Create room form
const createRoomForm = ref({
  room_name: '',
  limit: 5,
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

// Build SSE URL
const buildSSEUrl = (path: string) => {
  return `${runtimeConfig.public.API_URL}/v2${path}`;
};

// SSE Event Source
const { status: sseStatus, data: sseData, event: sseEvent, close: closeSse } = useEventSource(
  buildSSEUrl('/pomodoro-rooms/events'),
  ['room_created', 'room_updated', 'member_joined', 'member_leaved', 'room_deleted'],
  {
    withCredentials: true,
    autoReconnect: {
      delay: 1000,
      onFailed() {
        console.error('Failed to connect to SSE after retries');
      },
    },
    serializer: {
      read: (rawData?: string) => {
        if (!rawData) return null;
        try{
          return JSON.parse(rawData);
        }
        catch{
          return null;
        }
      },
    },
  }
);

// Watch for SSE events
const handleSSEEvent = (event: any, eventData: any) => {
  if (!eventData) return;

  let roomIndex: number
  switch (event) {
    case 'room_created':
      // Add new room to the list
      const newRoom: PomodoroRoom = {
        ...eventData,
        created_at: eventData.created_at || new Date().toISOString(),
      };
      // Avoid duplicates
      if (!rooms.value.find(r => r.livekit_room_name === newRoom.livekit_room_name)) {
        rooms.value.unshift(newRoom);
      }
      break;

    case 'room_deleted':
      // Remove room from the list
      const deletedRoomName = eventData.livekit_room_name;
      rooms.value = rooms.value.filter(r => r.livekit_room_name !== deletedRoomName);
      break;

    case 'member_joined':
      // Update room in the list
      roomIndex = rooms.value.findIndex(
        r => r.livekit_room_name === eventData.livekit_room_name
      );
      if (roomIndex !== -1) {
        rooms.value[roomIndex] = {
          ...rooms.value[roomIndex],
          num_participants: rooms.value[roomIndex].num_participants + 1,
        };
      }
      break

    case 'member_leaved':
      // Update room in the list
      roomIndex = rooms.value.findIndex(
        r => r.livekit_room_name === eventData.livekit_room_name
      );
      if (roomIndex !== -1) {
        rooms.value[roomIndex] = {
          ...rooms.value[roomIndex],
          num_participants: rooms.value[roomIndex].num_participants - 1,
        };
      }
      break

    case 'room_updated':
      // Update room in the list
      roomIndex = rooms.value.findIndex(
        r => r.livekit_room_name === eventData.livekit_room_name
      );
      if (roomIndex !== -1) {
        rooms.value[roomIndex] = {
          ...rooms.value[roomIndex],
          ...eventData,
        };
      }
      break;
  }
};

// Watch SSE data changes
watch(
  sseData,
  () => {
    handleSSEEvent(sseEvent.value, sseData.value);
  },
);

// Fetch rooms list
const fetchRooms = async () => {
  try {
    refreshing.value = true;
    error.value = null;
    const response = await api.get(buildApiUrl('/'));
    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
    }
    const data = await response.json();
    rooms.value = data || [];
  } catch (err: any) {
    error.value = err.message || t('pomodoroRoom.errors.fetch_failed');
    console.error('Error fetching rooms:', err);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// Refresh rooms
const refreshRooms = async () => {
  await fetchRooms();
};

// Create room
const createRoom = async () => {
  if (!createRoomForm.value.room_name.trim()) {
    error.value = t('pomodoroRoom.errors.room_name_required', { default: 'Room name is required' });
    return;
  }

  try {
    creatingRoom.value = true;
    error.value = null;

    const response = await api.post(buildApiUrl('/'), {
      room_name: createRoomForm.value.room_name.trim(),
      limit: createRoomForm.value.limit,
      pomodoro_settings: {
        pomodoro_study_time: createRoomForm.value.pomodoro_settings.pomodoro_study_time * 60,
        pomodoro_rest_time: createRoomForm.value.pomodoro_settings.pomodoro_rest_time * 60,
        pomodoro_long_rest_time: createRoomForm.value.pomodoro_settings.pomodoro_long_rest_time * 60,
        long_rest_time_interval: createRoomForm.value.pomodoro_settings.long_rest_time_interval,
      },
    });

    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
    }

    const createdRoom = await response.json();

    // Reset form and close modal
    resetCreateForm();
    showCreateModal.value = false;

    selectRoom(createdRoom);
  } catch (err: any) {
    error.value = err.message || t('pomodoroRoom.errors.create_failed', { default: 'Failed to create room' });
    console.error('Error creating room:', err);
  } finally {
    creatingRoom.value = false;
  }
};

// Reset create form
const resetCreateForm = () => {
  createRoomForm.value = {
    room_name: '',
    limit: 5,
    pomodoro_settings: {
      pomodoro_study_time: 25,
      pomodoro_rest_time: 5,
      pomodoro_long_rest_time: 20,
      long_rest_time_interval: 3,
    },
  };
};

// Open create modal
const openCreateModal = () => {
  resetCreateForm();
  showCreateModal.value = true;
};

// Emit select room event
const emit = defineEmits<{
  selectRoom: [room: PomodoroRoom];
}>();

const selectRoom = (room: PomodoroRoom) => {
  emit('selectRoom', room);
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return t('pomodoroRoom.time.just_now', { default: 'Just now' });
  if (diffMins < 60) return t('pomodoroRoom.time.mins_ago', { mins: diffMins }, { default: `${diffMins}m ago` });

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t('pomodoroRoom.time.hours_ago', { hours: diffHours }, { default: `${diffHours}h ago` });

  const diffDays = Math.floor(diffHours / 24);
  return t('pomodoroRoom.time.days_ago', { days: diffDays }, { default: `${diffDays}d ago` });
};

// Check if room is full
const isRoomFull = (room: PomodoroRoom) => {
  return room.num_participants >= room.limit;
};

// Computed properties
const sseStatusText = computed(() => {
  const status = String(sseStatus.value);
  return status === 'OPEN' || status === 'CONNECTING'
    ? t('pomodoroRoom.live_connected')
    : t('pomodoroRoom.live_disconnected');
});

const sseStatusClass = computed(() => {
  const status = String(sseStatus.value);
  return status === 'OPEN' || status === 'CONNECTING'
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
});

const sseIndicatorClass = computed(() => {
  const status = String(sseStatus.value);
  return status === 'OPEN' || status === 'CONNECTING'
    ? 'bg-green-500 animate-pulse'
    : 'bg-red-500';
});

// Filter rooms based on search query
const filteredRooms = computed(() => {
  if (!searchQuery.value.trim()) {
    return rooms.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return rooms.value.filter(room =>
    room.room_name.toLowerCase().includes(query)
  );
});

// Lifecycle
onMounted(() => {
  fetchRooms();
});

onUnmounted(() => {
  closeSse();
});
</script>

<template lang="pug">
div(class="flex flex-col h-full overflow-hidden")
  // Sticky header
  div(class="flex-shrink-0 flex px-4 mb-2 items-center gap-2")
    // Search input
    div(class="relative flex-grow")
      SearchIcon(class="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" :size="18")
      Input(
        v-model="searchQuery"
        :placeholder="$t('pomodoroRoom.search_placeholder', { default: 'Search rooms...' })"
        class="pl-10 pr-10"
      )
      CircleXIcon(
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80 cursor-pointer"
        :size="18"
      )

    // Action buttons
    Dialog(v-model:open="showCreateModal")
        form
          DialogTrigger(as-child)
            Button(variant="default") {{ $t('pomodoroRoom.create_room', { default: 'Create room' }) }}
          DialogContent(class="sm:max-w-[425px]")
            DialogHeader
              DialogTitle {{ $t('pomodoroRoom.createDialog.title') }}
            div(class="grid gap-4")
              // Room name
              div(class="grid gap-3")
                Label(for="name-1")
                  | {{ $t('pomodoroRoom.createDialog.room_name_label') }}
                  span(class="text-red-500") *
                Input(
                  id="name-1" name="room name"
                  v-model="createRoomForm.room_name"
                  :placeholder="$t('pomodoroRoom.createDialog.room_name_placeholder')"
                  @keyup.enter="createRoom"
                )
              // Limit
              NumberField(id="limit" :default-value="5" :min="1" :max="10")
                Label(for="limit")
                  | {{ $t('pomodoroRoom.createDialog.limit_label') }}
                  span(class="text-gray-500") &nbsp(1-10)
                NumberFieldContent
                  NumberFieldDecrement
                  NumberFieldInput
                  NumberFieldIncrement

              // Pomodoro settings
              div(class="border-t border-gray-200 dark:border-gray-700 pt-4")
                h4(class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3")
                  | {{ $t('pomodoroRoom.createDialog.pomodoro_settings_label') }}
                // Study time
                NumberField(
                  id="study_time" class="mb-2"
                  v-model.number="createRoomForm.pomodoro_settings.pomodoro_study_time"
                  :default-value="25" :min="5" :max="180"
                )
                  Label(for="study_time")
                    | {{ $t('pomodoroRoom.createDialog.study_time_label') }}
                    span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes') }})
                  NumberFieldContent
                    NumberFieldDecrement
                    NumberFieldInput
                    NumberFieldIncrement

                // Rest time
                NumberField(
                  id="rest_time" class="mb-2"
                  v-model.number="createRoomForm.pomodoro_settings.pomodoro_rest_time"
                  :default-value="5" :min="1" :max="180"
                )
                  Label(for="rest_time")
                    | {{ $t('pomodoroRoom.createDialog.rest_time_label') }}
                    span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes') }})
                  NumberFieldContent
                    NumberFieldDecrement
                    NumberFieldInput
                    NumberFieldIncrement

                // Long rest time
                NumberField(
                  id="long_rest_time" class="mb-2"
                  v-model.number="createRoomForm.pomodoro_settings.pomodoro_long_rest_time"
                  :default-value="20" :min="1" :max="180"
                )
                  Label(for="long_rest_time")
                    | {{ $t('pomodoroRoom.createDialog.long_rest_time_label') }}
                    span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes') }})
                  NumberFieldContent
                    NumberFieldDecrement
                    NumberFieldInput
                    NumberFieldIncrement

                // Long rest interval
                NumberField(
                  id="long_rest_interval"
                  v-model.number="createRoomForm.pomodoro_settings.long_rest_time_interval"
                  :default-value="3" :min="2" :max="10"
                )
                  Label(for="long_rest_interval")
                    |{{ $t('pomodoroRoom.createDialog.long_rest_interval_label') }}
                    span(class="text-gray-500") &nbsp(2-10)
                  NumberFieldContent
                    NumberFieldDecrement
                    NumberFieldInput
                    NumberFieldIncrement
            DialogFooter
              DialogClose(as-child)
                Button(
                  variant="outline"
                  :disabled="creatingRoom"
                ) {{ $t('pomodoroRoom.createDialog.cancel') }}
              Button(
                type="submit"
                :disabled="creatingRoom || !createRoomForm.room_name.trim()"
                @click='createRoom'
              )
                Spinner(v-if="creatingRoom")
                |{{ creatingRoom ? $t('pomodoroRoom.createDialog.creating') : $t('pomodoroRoom.createDialog.create') }}
  // Loading state
  div(v-if="loading" class="flex items-center justify-center py-12 h-full")
    Loading(size="lg" :text="$t('pomodoroRoom.loading', { default: 'Loading rooms...' })")

  // Error state
  div(v-else-if="error" class="flex flex-col items-center justify-center py-12 px-4 h-full")
    div(class="text-red-500 dark:text-red-400 mb-4")
      | {{ error }}
    Button(@click="refreshRooms" variant="outline")
      | {{ $t('pomodoroRoom.retry', { default: 'Retry' }) }}

  // Empty state
  div(v-else-if="rooms.length === 0" class="flex flex-col items-center justify-center py-12 px-4 h-full")
    VideoIcon(:size="48" class="text-gray-400 dark:text-gray-600 mb-4")
    p(class="text-gray-500 dark:text-gray-400 text-center")
      | {{ $t('pomodoroRoom.no_rooms', { default: 'No rooms available. Be the first to create one!' }) }}

  // No search results
  div(v-else-if="filteredRooms.length === 0" class="flex flex-col items-center justify-center py-12 px-4 h-full")
    SearchIcon(:size="48" class="text-gray-400 dark:text-gray-600 mb-4")
    p(class="text-gray-500 dark:text-gray-400 text-center")
      | {{ $t('pomodoroRoom.no_search_results', { default: 'No rooms found matching your search.' }) }}

  // Room list
  div(v-else class="flex-grow overflow-y-auto p-4 space-y-3 min-h-0")
    div(
      v-for="room in filteredRooms"
      :key="room.livekit_room_name"
      class="p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md"
      :class="currentRoom?.livekit_room_name === room.livekit_room_name ? 'hover:bg-primary-container dark:hover:bg-primary-darkcontainer bg-surface-variant dark:bg-surface-darkvariant border-primary-500 dark:border-primary-500' : (isRoomFull(room) ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500')"
      @click="!isRoomFull(room) && selectRoom(room)"
    )
      // Room header
      div(class="flex items-start justify-between mb-2")
        div(class="flex items-center gap-2")
          h3(class="font-semibold text-gray-900 dark:text-gray-100")
            | {{ room.room_name }}
        div(
          class="px-2 py-1 text-xs rounded-full"
          :class="isRoomFull(room) ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'"
        )
          | {{ isRoomFull(room) ? $t('pomodoroRoom.full', { default: 'Full' }) : $t('pomodoroRoom.available', { default: 'Available' }) }}

      // Room info
      div(class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400")
        // Participants
        div(class="flex items-center gap-1")
          UsersIcon(:size="16")
          span
            | {{ room.num_participants }}/{{ room.limit }}

        // Pomodoro settings
        ButtonGroup(v-if="room.pomodoro_settings" class="ml-auto")
          Button(variant="outline" size="sm" class="h-6 px-2 text-xs")
            | {{ Math.floor(room.pomodoro_settings.pomodoro_study_time / 60) }}m
          Button(variant="outline" size="sm" class="h-6 px-2 text-xs")
            | {{ Math.floor(room.pomodoro_settings.pomodoro_rest_time / 60) }}m

        // Created time
        div
          | {{ formatDate(room.created_at) }}

      // Full room message
      div(v-if="isRoomFull(room)" class="mt-2 text-xs text-red-600 dark:text-red-400")
        | {{ $t('pomodoroRoom.room_full_message', { default: 'This room is full. Please try another room.' }) }}

  // Sticky footer - SSE Status indicator
  div(class="flex-shrink-0 px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs")
    div(class="flex items-center gap-2")
      div(
        class="w-2 h-2 rounded-full"
        :class="sseIndicatorClass"
      )
      span(
        :class="sseStatusClass"
      )
        | {{ sseStatusText }}
</template>
