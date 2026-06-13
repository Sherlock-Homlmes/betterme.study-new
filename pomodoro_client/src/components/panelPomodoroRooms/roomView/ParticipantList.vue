<script setup lang="ts">
import { computed } from 'vue';
import { MicrophoneIcon, MicrophoneOffIcon, VideoIcon, VideoOffIcon, UsersIcon } from 'vue-tabler-icons';
import { usePomodoroRoomsStore } from '@/stores/pomodoroRooms';

const {
  participants,
  localParticipant,
  totalParticipants,
  getLocalParticipantAvatar,
  getParticipantAvatar,
} = usePomodoroRoomsStore();

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};
</script>

<template lang="pug">
div(class="flex flex-col h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900")
  // Header
  div(class="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700")
    UsersIcon(:size="16" class="text-gray-500")
    span(class="text-sm font-medium text-gray-700 dark:text-gray-300")
      | {{ totalParticipants }} participant{{ totalParticipants !== 1 ? 's' : '' }}

  // Participant list
  div(class="flex-grow overflow-y-auto p-2 space-y-1")
    // Local participant
    div(
      v-if="localParticipant"
      class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
    )
      // Avatar
      div(class="w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0")
        img(
          v-if="getLocalParticipantAvatar()"
          :src="getLocalParticipantAvatar() || ''"
          class="w-full h-full object-cover"
          @error="handleAvatarError"
        )
        div(v-else class="w-full h-full flex items-center justify-center text-xs text-gray-500")
          | {{ localParticipant.identity?.charAt(0)?.toUpperCase() }}

      // Name + You badge
      div(class="flex-grow min-w-0")
        div(class="flex items-center gap-1.5")
          span(class="text-sm text-gray-900 dark:text-gray-100 truncate")
            | {{ localParticipant.name || localParticipant.identity }}
          span(class="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex-shrink-0")
            | You

      // Media status icons
      div(class="flex items-center gap-1 flex-shrink-0")
        MicrophoneIcon(v-if="localParticipant.isMicrophoneEnabled" :size="14" class="text-green-500")
        MicrophoneOffIcon(v-else :size="14" class="text-gray-400")
        VideoIcon(v-if="localParticipant.isCameraEnabled" :size="14" class="text-green-500")
        VideoOffIcon(v-else :size="14" class="text-gray-400")

    // Remote participants
    div(
      v-for="participant in participants"
      :key="participant.identity"
      class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
      :class="{ 'ring-1 ring-green-400 ring-inset': participant.isSpeaking }"
    )
      // Avatar
      div(class="w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0")
        img(
          v-if="getParticipantAvatar(participant)"
          :src="getParticipantAvatar(participant) || ''"
          class="w-full h-full object-cover"
          @error="handleAvatarError"
        )
        div(v-else class="w-full h-full flex items-center justify-center text-xs text-gray-500")
          | {{ (participant.name || participant.identity)?.charAt(0)?.toUpperCase() }}

      // Name
      div(class="flex-grow min-w-0")
        div(class="flex items-center gap-1.5")
          span(class="text-sm text-gray-900 dark:text-gray-100 truncate")
            | {{ participant.name || participant.identity }}
          span(
            v-if="participant.isSpeaking"
            class="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex-shrink-0 animate-pulse"
          )
            | speaking

      // Media status icons
      div(class="flex items-center gap-1 flex-shrink-0")
        MicrophoneIcon(v-if="participant.isMicrophoneEnabled" :size="14" class="text-green-500")
        MicrophoneOffIcon(v-else :size="14" class="text-gray-400")
        VideoIcon(v-if="participant.isCameraEnabled" :size="14" class="text-green-500")
        VideoOffIcon(v-else :size="14" class="text-gray-400")
</template>
