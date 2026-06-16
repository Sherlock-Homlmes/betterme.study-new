<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useEventSource } from '@vueuse/core';
import { runtimeConfig } from '@/config/runtimeConfig';
import { api } from '@/utils/betterFetch';
import { VideoIcon, SearchIcon, CircleXIcon } from 'vue-tabler-icons';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePomodoroRoomsStore, type RoomInfo } from '@/stores/pomodoroRooms';
import CreateRoomDialog from './roomView/CreateRoomDialog.vue';
import RoomCard from './roomView/RoomCard.vue';

const { t } = useI18n();
const { currentRoom } = usePomodoroRoomsStore();
const { userInfo } = useAuthStore();

const deletingRoom = ref<string | null>(null);

// State
const rooms = ref<RoomInfo[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const refreshing = ref(false);
const showCreateModal = ref(false);
const searchQuery = ref('');

// Build API URL
const buildApiUrl = (path: string) => {
  return `${runtimeConfig.public.API_URL}/v2/pomodoro-rooms${path}`;
};

// Build SSE URL
const buildSSEUrl = (path: string) => {
  return `${runtimeConfig.public.API_URL}/v2${path}`;
};

// Delete room (only creator)
const deleteRoom = async (room: RoomInfo, event: Event) => {
  event.stopPropagation();
  if (!confirm(t('pomodoroRoom.delete_confirm', { default: 'Delete this room?' }))) return;
  try {
    deletingRoom.value = room.livekit_room_name;
    const response = await api.delete(buildApiUrl(`/${room.livekit_room_name}`));
    if (!response || !response.ok) throw new Error('Failed to delete room');
    rooms.value = rooms.value.filter(r => r.livekit_room_name !== room.livekit_room_name);
  } catch (err: any) {
    error.value = err.message || 'Failed to delete room';
  } finally {
    deletingRoom.value = null;
  }
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
      const newRoom: RoomInfo = {
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

// Emit select room event
const emit = defineEmits<{
  selectRoom: [room: RoomInfo];
  createRoom: [room: RoomInfo];
}>();

const selectRoom = (room: RoomInfo) => {
  emit('selectRoom', room);
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
    CreateRoomDialog(v-model:open="showCreateModal" @created="(room: RoomInfo) => emit('createRoom', room)")
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
    RoomCard(
      v-for="room in filteredRooms"
      :key="room.livekit_room_name"
      :room="room"
      :is-current="currentRoom?.livekit_room_name === room.livekit_room_name"
      :can-delete="userInfo && room.created_by === userInfo.id"
      :deleting="deletingRoom === room.livekit_room_name"
      @select="selectRoom(room)"
      @delete="deleteRoom"
    )

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
