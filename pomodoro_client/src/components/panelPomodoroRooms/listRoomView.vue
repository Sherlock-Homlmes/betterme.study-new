<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useEventSource } from '@vueuse/core';
import { runtimeConfig } from '@/config/runtimeConfig';
import { api } from '@/utils/betterFetch';
import { UsersIcon, PlusIcon, RefreshIcon, VideoIcon, XIcon as CloseIcon } from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";

const { t } = useI18n();

// Room data types
interface PomodoroRoom {
  room_name: string;
  livekit_room_name: string;
  limit: number;
  num_participants: number;
  created_by: string;
  created_at: string;
}

// State
const rooms = ref<PomodoroRoom[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const refreshing = ref(false);
const showCreateModal = ref(false);
const creatingRoom = ref(false);

// Create room form
const createRoomForm = ref({
  room_name: '',
  limit: 5,
  room_settings: {
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
      room_settings: {
        pomodoro_study_time: createRoomForm.value.room_settings.pomodoro_study_time * 60,
        pomodoro_rest_time: createRoomForm.value.room_settings.pomodoro_rest_time * 60,
        pomodoro_long_rest_time: createRoomForm.value.room_settings.pomodoro_long_rest_time * 60,
        long_rest_time_interval: createRoomForm.value.room_settings.long_rest_time_interval,
      },
    });

    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
    }

    const data = await response.json();
    
    // Add the new room to the list
    rooms.value.unshift(data);
    
    // Reset form and close modal
    resetCreateForm();
    showCreateModal.value = false;
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
    room_settings: {
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

// Lifecycle
onMounted(() => {
  fetchRooms();
});

onUnmounted(() => {
  closeSse();
});
</script>

<template lang="pug">
div(class="flex flex-col h-full")
  div(class="flex items-end gap-2")
      Button(
        variant="outline"
        size="sm"
        @click="openCreateModal"
        class="gap-1"
      )
        PlusIcon(:size="16")
        span {{ $t('pomodoroRoom.create_room', { default: 'Create Room' }) }}
      Button(
        variant="ghost"
        size="sm"
        @click="refreshRooms"
        :disabled="refreshing"
        class="gap-1"
      )
        RefreshIcon(:size="16" :class="{ 'animate-spin': refreshing }")
        span {{ $t('pomodoroRoom.refresh', { default: 'Refresh' }) }}
  
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
  
  // Room list
  div(v-else class="flex-grow overflow-y-auto p-4 space-y-3")
    div(
      v-for="room in rooms"
      :key="room.livekit_room_name"
      class="p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md"
      :class="isRoomFull(room) ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500'"
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
        // Created time
        div
          | {{ formatDate(room.created_at) }}
      
      // Full room message
      div(v-if="isRoomFull(room)" class="mt-2 text-xs text-red-600 dark:text-red-400")
        | {{ $t('pomodoroRoom.room_full_message', { default: 'This room is full. Please try another room.' }) }}
  
  // SSE Status indicator
  div(class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs")
    div(class="flex items-center gap-2")
      div(
        class="w-2 h-2 rounded-full"
        :class="sseIndicatorClass"
      )
      span(
        :class="sseStatusClass"
      )
        | {{ sseStatusText }}
  
  // Create Room Modal
  div(v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4")
    div(class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto")
      // Modal header
      div(class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700")
        h3(class="text-lg font-semibold")
          | {{ $t('pomodoroRoom.createDialog.title', { default: 'Create New Room' }) }}
        ControlButton(
          :aria-label="$t('settings.buttons.close')"
          default-style
          circle
          :importance="ButtonImportance.Text"
          @click="showCreateModal = false"
        )
          CloseIcon(:size="20")
      
      // Modal body
      div(class="p-4 space-y-4")
        // Room name
        div
          label(class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1")
            | {{ $t('pomodoroRoom.createDialog.room_name_label', { default: 'Room Name' }) }}
            span(class="text-red-500") *
          input(
            v-model="createRoomForm.room_name"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            :placeholder="$t('pomodoroRoom.createDialog.room_name_placeholder', { default: 'Enter room name' })"
            @keyup.enter="createRoom"
          )
        
        // Limit
        div
          label(class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1")
            | {{ $t('pomodoroRoom.createDialog.limit_label', { default: 'Max Participants' }) }}
            span(class="text-gray-500") (1-10)
          input(
            v-model.number="createRoomForm.limit"
            type="number"
            min="1"
            max="10"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          )
        
        // Room settings
        div(class="border-t border-gray-200 dark:border-gray-700 pt-4")
          h4(class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3")
            | {{ $t('pomodoroRoom.createDialog.room_settings_label', { default: 'Pomodoro Settings' }) }}
          
          // Study time
          div
            label(class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1")
              | {{ $t('pomodoroRoom.createDialog.study_time_label', { default: 'Study Time' }) }}
              span(class="text-gray-500") ({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
            input(
              v-model.number="createRoomForm.room_settings.pomodoro_study_time"
              type="number"
              min="5"
              max="180"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            )
          
          // Rest time
          div
            label(class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1")
              | {{ $t('pomodoroRoom.createDialog.rest_time_label', { default: 'Rest Time' }) }}
              span(class="text-gray-500") ({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
            input(
              v-model.number="createRoomForm.room_settings.pomodoro_rest_time"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            )
          
          // Long rest time
          div
            label(class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1")
              | {{ $t('pomodoroRoom.createDialog.long_rest_time_label', { default: 'Long Rest Time' }) }}
              span(class="text-gray-500") ({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
            input(
              v-model.number="createRoomForm.room_settings.pomodoro_long_rest_time"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            )
          
          // Long rest interval
          div
            label(class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1")
              | {{ $t('pomodoroRoom.createDialog.long_rest_interval_label', { default: 'Long Rest Interval' }) }}
              span(class="text-gray-500") ({{ $t('pomodoroRoom.pomodoros', { default: 'pomodoros' }) }})
            input(
              v-model.number="createRoomForm.room_settings.long_rest_time_interval"
              type="number"
              min="1"
              max="10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            )
      
      // Modal footer
      div(class="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700")
        Button(
          variant="ghost"
          @click="showCreateModal = false"
          :disabled="creatingRoom"
        )
          | {{ $t('pomodoroRoom.createDialog.cancel', { default: 'Cancel' }) }}
        Button(
          variant="default"
          @click="createRoom"
          :disabled="creatingRoom || !createRoomForm.room_name.trim()"
        )
          Loading(v-if="creatingRoom" :size="16" class="mr-1")
          | {{ creatingRoom ? $t('pomodoroRoom.createDialog.creating') : $t('pomodoroRoom.createDialog.create') }}
</template>
